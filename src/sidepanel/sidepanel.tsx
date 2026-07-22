import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Platform, 
  Tone, 
  Length, 
  Language,
  ExtractedContext,
  GeneratedComment,
  GenerationOptions,
  HistoryItem,
  FavoriteComment,
  DEFAULT_SETTINGS,
  TONE_OPTIONS,
  LENGTH_OPTIONS,
  LANGUAGE_OPTIONS,
  COUNT_OPTIONS
} from '@types';
import { 
  getPlatformFromUrl, 
  generateId,
  sanitizeText,
  formatDate,
  getToneLabel,
  getLengthLabel,
  getLanguageLabel,
  getPlatformLabel,
  getPlatformEmoji
} from '@utils/helpers';
import { useSettings, useHistory, useFavorites, useTheme } from '@hooks/useStorage';
import { useAI, useClipboard } from '@hooks/useAI';
import { isAIConfigured as checkAIConfigured } from '@utils/storage';
import { Button, Spinner } from '@components/Button';
import { CustomSelect } from '@components/Select';
import { Input, Textarea } from '@components/Input';
import { 
  Copy, 
  Send, 
  RefreshCw, 
  Heart, 
  History, 
  Star, 
  Settings,
  Sparkles,
  Loader2,
  Search,
  X,
  Clock,
  Globe,
  User,
  MessageSquare,
  Trash2
} from 'lucide-react';

// Import CSS
import './sidepanel.css';

/**
 * Side Panel Component
 */
function SidePanel() {
  const [settings] = useSettings();
  const [history] = useHistory();
  const [favorites, addFavorite, removeFavorite] = useFavorites();
  const [generateComments, isGenerating, generationError] = useAI();
  const [copyToClipboard, isCopied] = useClipboard();
  const [theme] = useTheme();

  // State
  const [context, setContext] = useState<Partial<ExtractedContext>>({});
  const [comments, setComments] = useState<GeneratedComment[]>([]);
  const [selectedCommentIndex, setSelectedCommentIndex] = useState<number | null>(null);
  const [isContextLoading, setIsContextLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'favorites' | 'settings'>('generate');
  const [searchQuery, setSearchQuery] = useState('');

  // Options state
  const [tone, setTone] = useState<Tone>(settings.defaultTone || 'friendly');
  const [length, setLength] = useState<Length>(settings.defaultLength || 'medium');
  const [language, setLanguage] = useState<Language>(settings.defaultLanguage || 'auto');
  const [count, setCount] = useState<number>(3);

  // Custom context state
  const [customContext, setCustomContext] = useState('');

  // Load initial data — never block the whole UI on context extraction
  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setIsContextLoading(true);
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (cancelled) return;

        setCurrentTab(tab || null);

        if (tab?.url || tab?.title) {
          setContext({
            platform: getPlatformFromUrl(tab.url || '') as Platform,
            url: tab.url || '',
            title: tab.title || '',
            description: '',
            author: '',
            postContent: '',
            selectedText: '',
            visibleText: '',
          });
        }

        if (!tab?.id) return;

        const response = await Promise.race([
          chrome.runtime.sendMessage({
            type: 'EXTRACT_CONTEXT',
            data: { tabId: tab.id },
          }),
          new Promise<{ error: string }>((resolve) =>
            setTimeout(() => resolve({ error: 'Context extraction timed out' }), 4000)
          ),
        ]);

        if (cancelled) return;

        if (response?.error) {
          console.warn('Context extraction:', response.error);
          return;
        }

        if (response?.data) {
          setContext(response.data);
        }
      } catch (err) {
        console.warn('Error loading initial data:', err);
      } finally {
        if (!cancelled) setIsContextLoading(false);
      }
    }

    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Update settings when they change
  useEffect(() => {
    if (settings) {
      setTone(settings.defaultTone || 'friendly');
      setLength(settings.defaultLength || 'medium');
      setLanguage(settings.defaultLanguage || 'auto');
    }
  }, [settings]);

  // Generate comments
  const handleGenerate = useCallback(async () => {
    if (!currentTab) {
      setError('No active tab found');
      return;
    }

    setError(null);
    setComments([]);

    try {
      const options: GenerationOptions = {
        tone,
        length,
        language,
        count,
      };

      // Use custom context if provided
      const contextToUse = customContext
        ? { ...context, postContent: customContext }
        : context;

      const generatedComments = await generateComments(contextToUse, options);
      setComments(generatedComments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate comments';
      setError(errorMessage);
    }
  }, [currentTab, context, tone, length, language, count, customContext, generateComments]);

  // Copy comment
  const handleCopy = useCallback(async (comment: string, index: number) => {
    const success = await copyToClipboard(comment);
    if (success) {
      setSelectedCommentIndex(index);
      setTimeout(() => setSelectedCommentIndex(null), 2000);
    }
  }, [copyToClipboard]);

  // Insert comment
  const handleInsert = useCallback(async (comment: string) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'INSERT_COMMENT',
        data: { comment },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to insert comment';
      setError(errorMessage);
    }
  }, []);

  // Favorite comment
  const handleFavorite = useCallback(async (comment: GeneratedComment) => {
    try {
      const favoriteComment: FavoriteComment = {
        ...comment,
        savedAt: Date.now(),
      };
      await addFavorite(favoriteComment);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save favorite';
      setError(errorMessage);
    }
  }, [addFavorite]);

  // Unfavorite comment
  const handleUnfavorite = useCallback(async (commentId: string) => {
    try {
      await removeFavorite(commentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove favorite';
      setError(errorMessage);
    }
  }, [removeFavorite]);

  // Regenerate comments
  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Open options page
  const handleOpenOptions = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  // Get platform display info
  const getPlatformInfo = useCallback(() => {
    const platform = context.platform || getPlatformFromUrl(currentTab?.url || '');
    return {
      value: platform,
      label: getPlatformLabel(platform as Platform),
      emoji: getPlatformEmoji(platform as Platform),
    };
  }, [context.platform, currentTab]);

  // Check if AI is configured
  const isAIConfigured = checkAIConfigured(settings);
  const displayError = error || generationError;

  // Filter history by search query
  const filteredHistory = history.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.comments.some(comment => 
        comment.content.toLowerCase().includes(query)
      ) ||
      (item.context.title && item.context.title.toLowerCase().includes(query)) ||
      (item.context.platform && item.context.platform.toLowerCase().includes(query))
    );
  });

  // Filter favorites by search query
  const filteredFavorites = favorites.filter(favorite => {
    const query = searchQuery.toLowerCase();
    return (
      favorite.content.toLowerCase().includes(query) ||
      (favorite.platform && favorite.platform.toLowerCase().includes(query))
    );
  });

  // Switch tab
  const handleTabChange = useCallback((tab: 'generate' | 'history' | 'favorites' | 'settings') => {
    setActiveTab(tab);
    setSearchQuery('');
    setComments([]);
    setError(null);
  }, []);

  // Initial context load only — do not block the UI while generating
  // (UI renders immediately; context fills in asynchronously)
  return (
    <div className="h-full flex flex-col bg-bg-primary text-text-primary">
      {/* Header */}
      <div className="fixed-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GR</span>
            </div>
            <div>
              <h1 className="font-semibold text-text-primary">GhostReply</h1>
              <p className="text-xs text-text-secondary">
                {isContextLoading ? 'Detecting page...' : 'AI Comment Generator'}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleOpenOptions}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 border-b border-border-color bg-bg-secondary">
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => handleTabChange('generate')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap ${
              activeTab === 'generate' 
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                : 'text-text-secondary hover:bg-secondary-100 dark:hover:bg-secondary-800'
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => handleTabChange('history')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap ${
              activeTab === 'history' 
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                : 'text-text-secondary hover:bg-secondary-100 dark:hover:bg-secondary-800'
            }`}
          >
            History
          </button>
          <button
            onClick={() => handleTabChange('favorites')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap ${
              activeTab === 'favorites' 
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                : 'text-text-secondary hover:bg-secondary-100 dark:hover:bg-secondary-800'
            }`}
          >
            Favorites
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="scrollable-content">
        <div className="main-content">
          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div className="space-y-4">
              {/* Platform Info */}
              {currentTab && (
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-primary-600">
                      {getPlatformInfo().emoji}
                    </span>
                    <span className="font-medium text-text-primary">
                      {getPlatformInfo().label}
                    </span>
                    <span className="text-text-secondary truncate flex-1">
                      {currentTab.title || 'Untitled'}
                    </span>
                  </div>
                </div>
              )}

              {/* Custom Context Input */}
              <div className="bg-bg-secondary rounded-lg p-4">
                <Textarea
                  label="Custom Context (Optional)"
                  placeholder="Add additional context or modify the extracted content..."
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  rows={3}
                  hint="This will override the automatically extracted content"
                />
              </div>

              {/* Options */}
              <div className="bg-bg-secondary rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Options</h3>
                <div className="grid grid-cols-2 gap-2">
                  <CustomSelect
                    label="Tone"
                    options={TONE_OPTIONS}
                    value={tone}
                    onChange={(value) => setTone(value as Tone)}
                    size="sm"
                  />
                  <CustomSelect
                    label="Length"
                    options={LENGTH_OPTIONS}
                    value={length}
                    onChange={(value) => setLength(value as Length)}
                    size="sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <CustomSelect
                    label="Language"
                    options={LANGUAGE_OPTIONS}
                    value={language}
                    onChange={(value) => setLanguage(value as Language)}
                    size="sm"
                  />
                  <CustomSelect
                    label="Count"
                    options={COUNT_OPTIONS}
                    value={count.toString()}
                    onChange={(value) => setCount(parseInt(value))}
                    size="sm"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <div className="pt-2">
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !isAIConfigured}
                  isLoading={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Comments
                    </>
                  )}
                </Button>
                
                {!isAIConfigured && (
                  <p className="text-xs text-yellow-600 mt-2 text-center">
                    Configure API in Settings
                  </p>
                )}

                {isGenerating && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-text-secondary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating reply...
                  </div>
                )}
              </div>

              {/* Comments */}
              {comments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">Results</span>
                    <span className="text-xs text-text-secondary">
                      {comments.length} comment{comments.length > 1 ? 's' : ''} generated
                    </span>
                  </div>
                  
                  {comments.map((comment, index) => {
                    const isSelected = selectedCommentIndex === index;
                    const isFavoriteComment = favorites.some(f => f.id === comment.id);

                    return (
                      <div 
                        key={comment.id}
                        className={`comment-card ${
                          isSelected ? 'comment-card-selected' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="comment-text">
                              {comment.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="badge badge-secondary">
                                {getToneLabel(comment.tone)}
                              </span>
                              <span className="badge badge-secondary">
                                {getLengthLabel(comment.length)}
                              </span>
                              <span className="text-xs text-text-secondary ml-auto">
                                {formatDate(comment.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="comment-actions">
                          <button 
                            onClick={() => handleCopy(comment.content, index)}
                            className="action-btn"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleInsert(comment.content)}
                            className="action-btn"
                            title="Insert"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => 
                              isFavoriteComment 
                                ? handleUnfavorite(comment.id)
                                : handleFavorite(comment)
                            }
                            className={`action-btn ${isFavoriteComment ? 'action-btn-danger' : ''}`}
                            title={isFavoriteComment ? 'Remove from Favorites' : 'Add to Favorites'}
                          >
                            <Heart 
                              className={`w-4 h-4 ${isFavoriteComment ? 'text-red-500 fill-red-500' : ''}`}
                            />
                          </button>
                        </div>
                        
                        {isCopied && isSelected && (
                          <div className="text-xs text-green-600 mt-1">Copied!</div>
                        )}
                      </div>
                    );
                  })}
                  
                  <div className="flex justify-center pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isGenerating && !comments.length && !displayError && activeTab === 'generate' && (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Sparkles className="w-16 h-16 text-primary-600 opacity-50" />
                  </div>
                  <h3 className="empty-state-title">Ready to Generate</h3>
                  <p className="empty-state-description">
                    Click "Generate Comments" to create AI-powered comments
                  </p>
                  <Button onClick={handleGenerate} disabled={!isAIConfigured}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Comments
                  </Button>
                </div>
              )}

              {/* Error State */}
              {displayError && !comments.length && activeTab === 'generate' && (
                <div className="error-state">
                  <div className="error-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="error-title">Error</h3>
                  <p className="error-description">{displayError}</p>
                  <div className="error-action">
                    <Button onClick={handleGenerate} size="sm">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <Input
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* History Items */}
              {filteredHistory.length > 0 ? (
                <div className="space-y-3">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-item-header">
                        <div className="history-item-meta">
                          <span className="platform-badge" style={{ color: getPlatformColor(item.context.platform) }}>
                            {getPlatformEmoji(item.context.platform as Platform)}
                            {getPlatformLabel(item.context.platform as Platform)}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {formatDate(item.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      {item.context.title && (
                        <h4 className="font-medium text-text-primary truncate">
                          {item.context.title}
                        </h4>
                      )}
                      
                      <div className="history-item-comments">
                        {item.comments.slice(0, 2).map((comment) => (
                          <p key={comment.id} className="text-sm text-text-secondary mt-1">
                            {comment.content.length > 100 
                              ? `${comment.content.substring(0, 100)}...` 
                              : comment.content}
                          </p>
                        ))}
                        {item.comments.length > 2 && (
                          <p className="text-xs text-text-secondary mt-1">
                            +{item.comments.length - 2} more comments
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Clock className="w-16 h-16 text-text-secondary opacity-50" />
                  </div>
                  <h3 className="empty-state-title">No History Yet</h3>
                  <p className="empty-state-description">
                    Your generated comments will appear here
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <Input
                  placeholder="Search favorites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Favorites */}
              {filteredFavorites.length > 0 ? (
                <div className="space-y-3">
                  {filteredFavorites.map((favorite) => (
                    <div key={favorite.id} className="favorite-item">
                      <div className="favorite-item-header">
                        <div className="favorite-item-meta">
                          <span className="platform-badge" style={{ color: getPlatformColor(favorite.platform) }}>
                            {getPlatformEmoji(favorite.platform as Platform)}
                            {getPlatformLabel(favorite.platform as Platform)}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {formatDate(favorite.savedAt || favorite.timestamp)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleUnfavorite(favorite.id)}
                          className="text-text-secondary hover:text-red-500 transition-colors"
                          title="Remove from Favorites"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="favorite-item-content">
                        <p className="text-text-primary whitespace-pre-wrap break-words">
                          {favorite.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="badge badge-secondary">
                            {getToneLabel(favorite.tone)}
                          </span>
                          <span className="badge badge-secondary">
                            {getLengthLabel(favorite.length)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="comment-actions mt-3">
                        <button 
                          onClick={() => copyToClipboard(favorite.content)}
                          className="action-btn"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleInsert(favorite.content)}
                          className="action-btn"
                          title="Insert"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Heart className="w-16 h-16 text-text-secondary opacity-50" />
                  </div>
                  <h3 className="empty-state-title">No Favorites Yet</h3>
                  <p className="empty-state-description">
                    Save your favorite comments by clicking the heart icon
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed-footer">
        <p className="text-xs text-text-secondary text-center">
          GhostReply v1.0.0 | Ctrl+Shift+G
        </p>
      </div>
    </div>
  );
}

// Helper function to get platform color
function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    youtube: '#FF0000',
    linkedin: '#0077B5',
    x: '#000000',
    twitter: '#1DA1F2',
    reddit: '#FF4500',
  };
  return colors[platform] || '#64748b';
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<SidePanel />);
}

export default SidePanel;
