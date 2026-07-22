import { ExtensionMessage, MessageType } from '@types';

/**
 * Send a message to the background service worker
 */
export async function sendMessageToBackground(
  type: MessageType,
  data?: any,
  requestId?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const message: ExtensionMessage = {
      type,
      data,
      requestId: requestId || generateRequestId(),
    };

    chrome.runtime.sendMessage(message, (response) => {
      // Handle chrome.runtime.lastError for async responses
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response?.error) {
        reject(new Error(response.error));
        return;
      }

      resolve(response?.data);
    });
  });
}

/**
 * Send a message to the current tab
 */
export async function sendMessageToTab(
  tabId: number,
  type: MessageType,
  data?: any,
  requestId?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const message: ExtensionMessage = {
      type,
      data,
      requestId: requestId || generateRequestId(),
    };

    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response?.error) {
        reject(new Error(response.error));
        return;
      }

      resolve(response?.data);
    });
  });
}

/**
 * Send a message to all tabs
 */
export async function sendMessageToAllTabs(
  type: MessageType,
  data?: any,
  requestId?: string
): Promise<any[]> {
  const results: any[] = [];
  
  const tabs = await chrome.tabs.query({});
  
  for (const tab of tabs) {
    if (tab.id) {
      try {
        const result = await sendMessageToTab(tab.id, type, data, requestId);
        results.push(result);
      } catch (error) {
        console.error(`Error sending message to tab ${tab.id}:`, error);
      }
    }
  }
  
  return results;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a message handler for background service worker
 */
export function createMessageHandler(handlers: Record<MessageType, (data: any, requestId: string) => Promise<any>>) {
  return async (message: ExtensionMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    try {
      const handler = handlers[message.type];
      
      if (!handler) {
        throw new Error(`No handler for message type: ${message.type}`);
      }

      const result = await handler(message.data, message.requestId || '');
      
      sendResponse({ data: result });
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    // Return true to indicate we want to send a response asynchronously
    return true;
  };
}

/**
 * Create a message listener for content scripts
 */
export function createContentMessageListener(handlers: Record<MessageType, (data: any, requestId: string) => Promise<any>>) {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    const handler = handlers[message.type];
    
    if (!handler) {
      sendResponse({ error: `No handler for message type: ${message.type}` });
      return;
    }

    handler(message.data, message.requestId || '')
      .then(result => sendResponse({ data: result }))
      .catch(error => sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' }));
    
    return true;
  });
}

/**
 * Validate message structure
 */
export function validateMessage(message: any): message is ExtensionMessage {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.type === 'string' &&
    (!message.data || typeof message.data === 'object') &&
    (!message.error || typeof message.error === 'string') &&
    (!message.requestId || typeof message.requestId === 'string')
  );
}
