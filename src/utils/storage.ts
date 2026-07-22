import { StorageKeys, UserSettings, HistoryItem, FavoriteComment, DEFAULT_SETTINGS, AIConfig } from '@types';

/**
 * Prefer local storage for settings (API keys). Sync has small quotas and
 * caused settings to look "saved" then get overwritten/lost.
 */
const SETTINGS_AREA = chrome.storage.local;

function normalizeAiConfig(aiConfig?: Partial<AIConfig>): AIConfig {
  const rawKey = (aiConfig?.apiKey || '').trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^Bearer\s+/i, '')
    .trim();

  const baseUrl = (aiConfig?.baseUrl || DEFAULT_SETTINGS.aiConfig.baseUrl)
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/chat\/completions$/i, '')
    .replace(/\/responses$/i, '')
    .replace(/\/messages$/i, '');

  return {
    baseUrl,
    apiKey: rawKey,
    model: (aiConfig?.model || DEFAULT_SETTINGS.aiConfig.model).trim(),
    temperature: typeof aiConfig?.temperature === 'number'
      ? aiConfig.temperature
      : DEFAULT_SETTINGS.aiConfig.temperature,
    maxTokens: typeof aiConfig?.maxTokens === 'number'
      ? aiConfig.maxTokens
      : DEFAULT_SETTINGS.aiConfig.maxTokens,
  };
}

function normalizeSettings(settings?: Partial<UserSettings> | null): UserSettings {
  return {
    defaultTone: settings?.defaultTone || DEFAULT_SETTINGS.defaultTone,
    defaultLength: settings?.defaultLength || DEFAULT_SETTINGS.defaultLength,
    defaultLanguage: settings?.defaultLanguage || DEFAULT_SETTINGS.defaultLanguage,
    theme: settings?.theme || DEFAULT_SETTINGS.theme,
    aiConfig: normalizeAiConfig(settings?.aiConfig),
  };
}

/**
 * Get settings from Chrome storage
 */
export async function getSettings(): Promise<UserSettings> {
  try {
    const local = await chrome.storage.local.get([StorageKeys.SETTINGS]);
    if (local[StorageKeys.SETTINGS]) {
      return normalizeSettings(local[StorageKeys.SETTINGS]);
    }

    // Migrate from sync if present
    const sync = await chrome.storage.sync.get([StorageKeys.SETTINGS]);
    if (sync[StorageKeys.SETTINGS]) {
      const migrated = normalizeSettings(sync[StorageKeys.SETTINGS]);
      await chrome.storage.local.set({ [StorageKeys.SETTINGS]: migrated });
      return migrated;
    }

    return { ...DEFAULT_SETTINGS, aiConfig: { ...DEFAULT_SETTINGS.aiConfig } };
  } catch (error) {
    console.error('Error getting settings:', error);
    return { ...DEFAULT_SETTINGS, aiConfig: { ...DEFAULT_SETTINGS.aiConfig } };
  }
}

/**
 * Save settings to Chrome storage
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    const normalized = normalizeSettings(settings);
    await SETTINGS_AREA.set({ [StorageKeys.SETTINGS]: normalized });
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
    const result = await chrome.storage.local.get([StorageKeys.FAVORITES]);
    if (result[StorageKeys.FAVORITES]) {
      return result[StorageKeys.FAVORITES];
    }

    const sync = await chrome.storage.sync.get([StorageKeys.FAVORITES]);
    if (sync[StorageKeys.FAVORITES]) {
      await chrome.storage.local.set({ [StorageKeys.FAVORITES]: sync[StorageKeys.FAVORITES] });
      return sync[StorageKeys.FAVORITES];
    }

    return [];
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
    const trimmedFavorites = favorites.slice(-50);
    await chrome.storage.local.set({ [StorageKeys.FAVORITES]: trimmedFavorites });
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
    await chrome.storage.local.remove([StorageKeys.FAVORITES]);
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
    await chrome.storage.local.set({
      [StorageKeys.SETTINGS]: {
        ...DEFAULT_SETTINGS,
        aiConfig: { ...DEFAULT_SETTINGS.aiConfig },
      },
    });
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
    const local = await chrome.storage.local.get([StorageKeys.SETTINGS]);
    if (local[StorageKeys.SETTINGS]) return;

    const sync = await chrome.storage.sync.get([StorageKeys.SETTINGS]);
    if (sync[StorageKeys.SETTINGS]) {
      await chrome.storage.local.set({
        [StorageKeys.SETTINGS]: normalizeSettings(sync[StorageKeys.SETTINGS]),
      });
    }
  } catch (error) {
    console.error('Error migrating storage:', error);
  }
}

export function isAIConfigured(settings?: UserSettings | null): boolean {
  const key = settings?.aiConfig?.apiKey?.trim();
  const baseUrl = settings?.aiConfig?.baseUrl?.trim();
  return !!(key && baseUrl);
}
