import { StorageKeys, UserSettings, HistoryItem, FavoriteComment, DEFAULT_SETTINGS } from '@types';

/**
 * Get settings from Chrome storage
 */
export async function getSettings(): Promise<UserSettings> {
  try {
    const result = await chrome.storage.sync.get([StorageKeys.SETTINGS]);
    return result[StorageKeys.SETTINGS] || DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to Chrome storage
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    await chrome.storage.sync.set({ [StorageKeys.SETTINGS]: settings });
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

/**
 * Get history from Chrome storage
 */
export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const result = await chrome.storage.local.get([StorageKeys.HISTORY]);
    return result[StorageKeys.HISTORY] || [];
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
}

/**
 * Save history to Chrome storage
 */
export async function saveHistory(history: HistoryItem[]): Promise<void> {
  try {
    // Keep only the last 100 items to prevent storage bloat
    const trimmedHistory = history.slice(-100);
    await chrome.storage.local.set({ [StorageKeys.HISTORY]: trimmedHistory });
  } catch (error) {
    console.error('Error saving history:', error);
    throw error;
  }
}

/**
 * Add a new history item
 */
export async function addHistoryItem(item: HistoryItem): Promise<void> {
  try {
    const history = await getHistory();
    history.push(item);
    await saveHistory(history);
  } catch (error) {
    console.error('Error adding history item:', error);
    throw error;
  }
}

/**
 * Get favorites from Chrome storage
 */
export async function getFavorites(): Promise<FavoriteComment[]> {
  try {
    const result = await chrome.storage.sync.get([StorageKeys.FAVORITES]);
    return result[StorageKeys.FAVORITES] || [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
}

/**
 * Save favorites to Chrome storage
 */
export async function saveFavorites(favorites: FavoriteComment[]): Promise<void> {
  try {
    // Keep only the last 50 favorites
    const trimmedFavorites = favorites.slice(-50);
    await chrome.storage.sync.set({ [StorageKeys.FAVORITES]: trimmedFavorites });
  } catch (error) {
    console.error('Error saving favorites:', error);
    throw error;
  }
}

/**
 * Add a new favorite
 */
export async function addFavorite(comment: FavoriteComment): Promise<void> {
  try {
    const favorites = await getFavorites();
    // Check if already favorited
    const exists = favorites.some(f => f.id === comment.id);
    if (!exists) {
      favorites.push(comment);
      await saveFavorites(favorites);
    }
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
}

/**
 * Remove a favorite
 */
export async function removeFavorite(commentId: string): Promise<void> {
  try {
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(f => f.id !== commentId);
    await saveFavorites(updatedFavorites);
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
}

/**
 * Check if a comment is favorited
 */
export async function isFavorite(commentId: string): Promise<boolean> {
  try {
    const favorites = await getFavorites();
    return favorites.some(f => f.id === commentId);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  try {
    await chrome.storage.local.remove([StorageKeys.HISTORY]);
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
}

/**
 * Clear all favorites
 */
export async function clearFavorites(): Promise<void> {
  try {
    await chrome.storage.sync.remove([StorageKeys.FAVORITES]);
  } catch (error) {
    console.error('Error clearing favorites:', error);
    throw error;
  }
}

/**
 * Reset all settings to defaults
 */
export async function resetSettings(): Promise<void> {
  try {
    await chrome.storage.sync.set({ [StorageKeys.SETTINGS]: DEFAULT_SETTINGS });
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
}

/**
 * Migrate old storage format if needed
 */
export async function migrateStorage(): Promise<void> {
  try {
    // Check for old local storage settings
    const oldSettings = await chrome.storage.local.get(['ghostreply_settings']);
    if (oldSettings.ghostreply_settings) {
      await chrome.storage.sync.set({ [StorageKeys.SETTINGS]: oldSettings.ghostreply_settings });
      await chrome.storage.local.remove(['ghostreply_settings']);
    }
  } catch (error) {
    console.error('Error migrating storage:', error);
  }
}
