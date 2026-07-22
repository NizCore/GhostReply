import { 
  ExtensionMessage, 
  MessageType, 
  MESSAGE_TYPES,
  UserSettings, 
  ExtractedContext, 
  GeneratedComment, 
  GenerationOptions,
  HistoryItem,
  FavoriteComment,
  StorageKeys,
  DEFAULT_SETTINGS
} from '../types';
import { getSettings, saveSettings, getHistory, saveHistory, addHistoryItem, getFavorites, saveFavorites, addFavorite, removeFavorite, isFavorite, migrateStorage } from '../utils/storage';
import { getAIService, resetAIService } from '../services/aiService';
import { getContextExtractor, resetContextExtractor } from '../services/contextExtractor';
import { getPromptBuilder, resetPromptBuilder } from '../services/promptBuilder';
import { generateId, sanitizeText } from '../utils/helpers';
import { createMessageHandler } from '../utils/messenger';

// Initialize storage migration
migrateStorage();

// Initialize AI service with default settings
let currentSettings: UserSettings = DEFAULT_SETTINGS;

// Load settings on startup
async function loadSettings() {
  try {
    currentSettings = await getSettings();
    resetAIService();
    getAIService(currentSettings.aiConfig);
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Load settings when background script starts
loadSettings();

// Set up context menu
function setupContextMenu() {
  // Remove existing context menu items
  chrome.contextMenus.removeAll(() => {
    // Create new context menu items
    chrome.contextMenus.create({
      id: 'generate-comment',
      title: 'GhostReply: Generate Comment',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'generate-reply',
      title: 'GhostReply: Generate Reply',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'open-ghostreply',
      title: 'GhostReply: Open Side Panel',
      contexts: ['all'],
    });
  });
}

// Set up context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
  loadSettings();
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  try {
    switch (info.menuItemId) {
      case 'generate-comment':
        if (info.selectionText) {
          // Send message to content script to generate comment from selected text
          await chrome.tabs.sendMessage(tab.id, {
            type: 'GENERATE_FROM_SELECTION',
            data: { text: info.selectionText },
          });
        }
        break;

      case 'generate-reply':
        if (info.selectionText) {
          // Send message to content script to generate reply from selected text
          await chrome.tabs.sendMessage(tab.id, {
            type: 'GENERATE_REPLY_FROM_SELECTION',
            data: { text: info.selectionText },
          });
        }
        break;

      case 'open-ghostreply':
        // Open side panel
        await chrome.sidePanel.open({ tabId: tab.id });
        break;
    }
  } catch (error) {
    console.error('Context menu error:', error);
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  try {
    switch (command) {
      case 'open_ghostreply':
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          // Check if side panel is available
          if (chrome.sidePanel) {
            await chrome.sidePanel.open({ tabId: tab.id });
          } else {
            // Fallback: open popup
            await chrome.action.openPopup();
          }
        }
        break;
    }
  } catch (error) {
    console.error('Keyboard shortcut error:', error);
  }
});

// Handle tab updates (for platform detection)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Update platform detection for this tab
    // This could be used for analytics or other purposes
  }
});

// Set up message handlers - use a type assertion to handle the MessageType union
const messageHandlers: Record<string, (data: any, requestId: string) => Promise<any>> = {
  // Settings handlers
  GET_SETTINGS: async () => {
    currentSettings = await getSettings();
    return currentSettings;
  },

  SAVE_SETTINGS: async (data: UserSettings) => {
    currentSettings = data;
    await saveSettings(data);
    resetAIService();
    getAIService(data.aiConfig);
    return { success: true };
  },

  // Context extraction handlers
  EXTRACT_CONTEXT: async (data: { tabId?: number }) => {
    const tabId = data.tabId || (await getCurrentTabId());
    if (!tabId) {
      throw new Error('No active tab found');
    }

    // Execute content script to extract context
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // This function will be injected into the page
        return (window as any).extractContextForBackground();
      },
    });

    if (result && result[0]?.result) {
      return result[0].result;
    }

    // Fallback: send message to content script
    return await sendMessageToTab(tabId, 'EXTRACT_CONTEXT');
  },

  // Comment generation handlers
  GENERATE_COMMENT: async (data: { context: Partial<ExtractedContext>; options: GenerationOptions }) => {
    const aiService = getAIService();
    
    if (!aiService.isConfigured()) {
      throw new Error('AI is not configured. Please set up your API key and base URL in settings.');
    }

    const comments = await aiService.generateComments(data.context, data.options);
    
    // Save to history
    const historyItem: HistoryItem = {
      id: generateId(),
      comments,
      context: data.context,
      timestamp: Date.now(),
    };
    
    await addHistoryItem(historyItem);

    return comments;
  },

  // Insert comment handlers
  INSERT_COMMENT: async (data: { comment: string; tabId?: number }) => {
    const tabId = data.tabId || (await getCurrentTabId());
    if (!tabId) {
      throw new Error('No active tab found');
    }

    // Send message to content script to insert comment
    return await sendMessageToTab(tabId, 'INSERT_COMMENT', data);
  },

  // History handlers
  GET_HISTORY: async () => {
    return await getHistory();
  },

  SAVE_HISTORY: async (data: HistoryItem[]) => {
    await saveHistory(data);
    return { success: true };
  },

  // Favorites handlers
  GET_FAVORITES: async () => {
    return await getFavorites();
  },

  SAVE_FAVORITE: async (data: FavoriteComment) => {
    await addFavorite(data);
    return { success: true };
  },

  REMOVE_FAVORITE: async (data: { commentId: string }) => {
    await removeFavorite(data.commentId);
    return { success: true };
  },

  // Side panel handlers
  OPEN_SIDE_PANEL: async (data: { tabId?: number }) => {
    const tabId = data.tabId || (await getCurrentTabId());
    if (!tabId) {
      throw new Error('No active tab found');
    }

    if (chrome.sidePanel) {
      await chrome.sidePanel.open({ tabId });
      return { success: true };
    }
    return { success: false, error: 'Side panel not available' };
  },

  CLOSE_SIDE_PANEL: async (data: { tabId?: number }) => {
    const tabId = data.tabId || (await getCurrentTabId());
    if (!tabId) {
      throw new Error('No active tab found');
    }

    if (chrome.sidePanel) {
      await chrome.sidePanel.close({ tabId });
      return { success: true };
    }
    return { success: false, error: 'Side panel not available' };
  },
};

// Create message handler
const messageHandler = createMessageHandler(messageHandlers as Record<MessageType, (data: any, requestId: string) => Promise<any>>);

// Set up runtime message listener
chrome.runtime.onMessage.addListener(messageHandler);

// Helper function to get current active tab ID
async function getCurrentTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

// Helper function to send message to a specific tab
async function sendMessageToTab(tabId: number, type: string, data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type, data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

// Handle tab activation (for context updates)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Could update current tab context here if needed
});

// Handle storage changes (sync settings across tabs)
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'sync' && changes[StorageKeys.SETTINGS]) {
    currentSettings = changes[StorageKeys.SETTINGS].newValue || DEFAULT_SETTINGS;
    resetAIService();
    getAIService(currentSettings.aiConfig);
  }
});

// Export for testing
export { loadSettings, setupContextMenu, getCurrentTabId, sendMessageToTab };
