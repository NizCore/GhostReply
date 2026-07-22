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
  formatDate
} from '@utils/helpers';
import { useSettings, useFavorites, useTheme } from '@hooks/useStorage';
import { useAI, useClipboard } from '@hooks/useAI';
import { isAIConfigured as checkAIConfigured } from '@utils/storage';
import { Button, Spinner } from '@components/Button';
import { CustomSelect } from '@components/Select';
import { 
  Copy, 
  Send, 
  RefreshCw, 
  Heart, 
  History, 
  Star, 
  Settings,
  Sparkles,
  Loader2
} from 'lucide-react';

// Import CSS
import './popup.css';

/**
 * Main Popup Component
 */
function Popup() {
  const [settings] = useSettings();
  const [favorites, addFavorite] = useFavorites();
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

  // Options state
  const [tone, setTone] = useState<Tone>(settings.defaultTone || 'friendly');
  const [length, setLength] = useState<Length>(settings.defaultLength || 'medium');
  const [language, setLanguage] = useState<Language>(settings.defaultLanguage || 'auto');
  const [count, setCount] = useState<number>(1);

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
        // Keep minimal tab context; do not block the UI
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

      const generatedComments = await generateComments(context, options);
      setComments(generatedComments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate comments';
      setError(errorMessage);
    }
  }, [currentTab, context, tone, length, language, count, generateComments]);

  // Copy comment
  const handleCopy = useCallback(async (comment: string, index: number) => {
    const success = await copyToClipboard(comment);
    if (success) {
      setSelectedCommentIndex(index);
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
      const favoriteComment = {
        ...comment,
        savedAt: Date.now(),
      };
      await addFavorite(favoriteComment);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save favorite';
      setError(errorMessage);
    }
  }, [addFavorite]);

  // Regenerate comments
  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Open side panel
  const handleOpenSidePanel = useCallback(async () => {
    try {
      if (currentTab?.id) {
        await chrome.sidePanel.open({ tabId: currentTab.id });
      }
    } catch (err) {
      console.error('Error opening side panel:', err);
    }
  }, [currentTab]);

  // Open options page
  const handleOpenOptions = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  // Get platform display info
  const getPlatformInfo = useCallback(() => {
    const platform = context.platform || getPlatformFromUrl(currentTab?.url || '');
    const platformOptions = [
      { value: 'youtube', label: 'YouTube', emoji: '📺', color: '#FF0000' },
      { value: 'linkedin', label: 'LinkedIn', emoji: '💼', color: '#0077B5' },
      { value: 'x', label: 'X', emoji: '🐦', color: '#000000' },
      { value: 'twitter', label: 'Twitter', emoji: '🐦', color: '#1DA1F2' },
      { value: 'reddit', label: 'Reddit', emoji: '🔴', color: '#FF4500' },
    ];
    
    const platformOption = platformOptions.find(p => p.value === platform);
    return platformOption || platformOptions[0];
  }, [context.platform, currentTab]);

  // Check if AI is configured
  const isAIConfigured = checkAIConfigured(settings);
  const displayError = error || generationError;

  return (
    <div className="min-w-[320px] max-h-[600px] overflow-y-auto bg-bg-primary text-text-primary">
      {/* Header */}
      <div className="p-4 border-b border-border-color">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">GR</span>
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
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleOpenSidePanel}
              title="Open Side Panel"
            >
              <History className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Platform Info */}
      {currentTab && (
        <div className="px-4 py-3 bg-primary-50 dark:bg-primary-900/20">
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

      {/* Options */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <CustomSelect
            options={TONE_OPTIONS}
            value={tone}
            onChange={(value) => setTone(value as Tone)}
            size="sm"
            placeholder="Select tone"
          />
          <CustomSelect
            options={LENGTH_OPTIONS}
            value={length}
            onChange={(value) => setLength(value as Length)}
            size="sm"
            placeholder="Select length"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <CustomSelect
            options={LANGUAGE_OPTIONS}
            value={language}
            onChange={(value) => setLanguage(value as Language)}
            size="sm"
            placeholder="Select language"
          />
          <CustomSelect
            options={COUNT_OPTIONS}
            value={count.toString()}
            onChange={(value) => setCount(parseInt(value))}
            size="sm"
            placeholder="Number of comments"
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="px-4 pb-4">
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

        {displayError && (
          <div className="mt-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {displayError}
          </div>
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
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
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
                className={`border border-border-color rounded-lg p-3 transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-primary-500 border-primary-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-text-primary whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-text-secondary">
                        {formatDate(comment.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border-color">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCopy(comment.content, index)}
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleInsert(comment.content)}
                    title="Insert"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleFavorite(comment)}
                    title={isFavoriteComment ? 'Favorited' : 'Favorite'}
                  >
                    <Heart 
                      className={`w-3.5 h-3.5 ${isFavoriteComment ? 'text-red-500 fill-red-500' : ''}`}
                    />
                  </Button>
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
      {!isGenerating && !comments.length && !displayError && (
        <div className="px-4 py-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="font-semibold text-text-primary mb-2">Ready to Generate</h3>
          <p className="text-sm text-text-secondary mb-4">
            Click "Generate Comments" to create AI-powered comments
          </p>
          <Button onClick={handleGenerate} disabled={!isAIConfigured}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Comments
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border-color text-center">
        <p className="text-xs text-text-secondary">
          GhostReply v1.0.0 | Ctrl+Shift+G
        </p>
      </div>
    </div>
  );
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}

export default Popup;
