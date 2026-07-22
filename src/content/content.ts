import { 
  ExtensionMessage, 
  MessageType, 
  ExtractedContext,
  GeneratedComment,
  GenerationOptions,
  UserSettings
} from '@types';
import { getContextExtractor, resetContextExtractor } from '@services/contextExtractor';
import { getCommentInserter, resetCommentInserter } from '@services/commentInserter';
import { getAIService, resetAIService } from '@services/aiService';
import { getSettings, saveSettings } from '@utils/storage';
import { createMessageHandler } from '@utils/messenger';

// Global state
let currentSettings: UserSettings | null = null;
let isInitialized = false;

// Initialize the content script
async function initialize() {
  if (isInitialized) return;

  try {
    // Load settings
    currentSettings = await getSettings();
    
    // Initialize services
    resetContextExtractor();
    resetCommentInserter();
    resetAIService();
    
    if (currentSettings) {
      getAIService(currentSettings.aiConfig);
    }

    isInitialized = true;
    console.log('GhostReply content script initialized');
  } catch (error) {
    console.error('Error initializing content script:', error);
  }
}

// Initialize on script load
initialize();

// Set up message handlers for content script
const contentMessageHandlers: Record<MessageType, (data: any, requestId: string) => Promise<any>> = {
  // Context extraction
  [MessageType.EXTRACT_CONTEXT]: async () => {
    const extractor = getContextExtractor();
    const context = await extractor.extractContext();
    return context;
  },

  // Comment generation
  [MessageType.GENERATE_COMMENT]: async (data: { context?: Partial<ExtractedContext>; options: GenerationOptions }) => {
    const aiService = getAIService();
    
    if (!aiService.isConfigured()) {
      throw new Error('AI is not configured. Please set up your API key and base URL in settings.');
    }

    // If no context provided, extract it
    let context = data.context;
    if (!context) {
      const extractor = getContextExtractor();
      context = await extractor.extractContext();
    }

    const comments = await aiService.generateComments(context, data.options);
    return comments;
  },

  // Comment insertion
  [MessageType.INSERT_COMMENT]: async (data: { comment: string }) => {
    const inserter = getCommentInserter();
    const success = inserter.insertComment(data.comment);
    
    if (!success) {
      throw new Error('Failed to insert comment. Could not find a comment box on this page.');
    }
    
    return { success: true };
  },

  // Generate from selected text
  [MessageType.GENERATE_FROM_SELECTION]: async (data: { text: string }) => {
    const extractor = getContextExtractor();
    const context = extractor.extractFromSelectedText();
    
    const aiService = getAIService();
    if (!aiService.isConfigured()) {
      throw new Error('AI is not configured.');
    }

    const options: GenerationOptions = {
      tone: currentSettings?.defaultTone || 'friendly',
      length: currentSettings?.defaultLength || 'medium',
      language: currentSettings?.defaultLanguage || 'auto',
      count: 1,
    };

    const comments = await aiService.generateComments(context, options);
    return comments[0];
  },

  // Generate reply from selected text
  [MessageType.GENERATE_REPLY_FROM_SELECTION]: async (data: { text: string }) => {
    const extractor = getContextExtractor();
    const context = extractor.extractFromSelectedText();
    
    const aiService = getAIService();
    if (!aiService.isConfigured()) {
      throw new Error('AI is not configured.');
    }

    const options: GenerationOptions = {
      tone: currentSettings?.defaultTone || 'friendly',
      length: currentSettings?.defaultLength || 'medium',
      language: currentSettings?.defaultLanguage || 'auto',
      count: 1,
    };

    // Use the selected text as parent comment for reply
    const comments = await aiService.generateComments(
      { ...context, postContent: data.text },
      options
    );
    return comments[0];
  },

  // Settings
  [MessageType.GET_SETTINGS]: async () => {
    currentSettings = await getSettings();
    return currentSettings;
  },

  [MessageType.SAVE_SETTINGS]: async (data: UserSettings) => {
    currentSettings = data;
    await saveSettings(data);
    resetAIService();
    getAIService(data.aiConfig);
    return { success: true };
  },
};

// Create message handler for content script
const contentMessageHandler = createMessageHandler(contentMessageHandlers);

// Set up runtime message listener
chrome.runtime.onMessage.addListener(contentMessageHandler);

// Expose functions to window for background script access
(window as any).extractContextForBackground = async (): Promise<ExtractedContext> => {
  const extractor = getContextExtractor();
  return await extractor.extractContext();
};

// Handle page changes (for SPAs)
let lastUrl = window.location.href;

function checkUrlChange() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    // Reset context extractor for new page
    resetContextExtractor();
    resetCommentInserter();
  }
}

// Check for URL changes periodically (for SPA navigation)
setInterval(checkUrlChange, 1000);

// Also listen for history state changes
window.addEventListener('popstate', () => {
  resetContextExtractor();
  resetCommentInserter();
});

// Handle beforeunload to clean up
window.addEventListener('beforeunload', () => {
  // Clean up if needed
});

// Inject CSS for better comment box detection (optional)
function injectCommentBoxStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* GhostReply: Improve comment box detection */
    [contenteditable="true"][aria-label*="comment" i],
    [contenteditable="true"][aria-label*="reply" i],
    [contenteditable="true"][aria-label*="tweet" i],
    [contenteditable="true"][aria-label*="post" i] {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
    
    [contenteditable="true"][aria-label*="comment" i]:focus,
    [contenteditable="true"][aria-label*="reply" i]:focus,
    [contenteditable="true"][aria-label*="tweet" i]:focus,
    [contenteditable="true"][aria-label*="post" i]:focus {
      outline: 2px solid #3b82f6;
    }
  `;
  document.head.appendChild(style);
}

// Inject styles after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectCommentBoxStyles);
} else {
  injectCommentBoxStyles();
}

// Export for testing
export { initialize, currentSettings, isInitialized };
