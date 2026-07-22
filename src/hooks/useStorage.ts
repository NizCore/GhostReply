import { useState, useEffect, useCallback } from 'react';
import { 
  UserSettings, 
  HistoryItem, 
  FavoriteComment,
  StorageKeys,
  DEFAULT_SETTINGS
} from '@types';
import { 
  getSettings, 
  saveSettings, 
  getHistory, 
  saveHistory, 
  addHistoryItem,
  getFavorites, 
  saveFavorites, 
  addFavorite, 
  removeFavorite, 
  isFavorite as checkIsFavorite
} from '@utils/storage';

/**
 * Hook for managing settings in Chrome storage
 */
export function useSettings(): [
  UserSettings,
  (settings: UserSettings) => Promise<void>,
  () => Promise<void>
] {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Load settings on mount + keep in sync across pages
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const loadedSettings = await getSettings();
        if (!cancelled) setSettings(loadedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }

    load();

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if ((area === 'local' || area === 'sync') && changes[StorageKeys.SETTINGS]) {
        const next = changes[StorageKeys.SETTINGS].newValue;
        if (next) {
          setSettings(next);
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      cancelled = true;
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Save settings
  const save = useCallback(async (newSettings: UserSettings) => {
    try {
      await saveSettings(newSettings);
      const confirmed = await getSettings();
      setSettings(confirmed);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }, []);

  // Reload settings
  const reload = useCallback(async () => {
    try {
      const loadedSettings = await getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error reloading settings:', error);
      throw error;
    }
  }, []);

  return [settings, save, reload];
}

/**
 * Hook for managing history in Chrome storage
 */
export function useHistory(): [
  HistoryItem[],
  (item: HistoryItem) => Promise<void>,
  (items: HistoryItem[]) => Promise<void>,
  () => Promise<void>
] {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load history on mount
  useEffect(() => {
    async function load() {
      try {
        const loadedHistory = await getHistory();
        setHistory(loadedHistory);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Add history item
  const addItem = useCallback(async (item: HistoryItem) => {
    try {
      await addHistoryItem(item);
      setHistory(prev => [...prev, item]);
    } catch (error) {
      console.error('Error adding history item:', error);
      throw error;
    }
  }, []);

  // Save all history
  const save = useCallback(async (items: HistoryItem[]) => {
    try {
      await saveHistory(items);
      setHistory(items);
    } catch (error) {
      console.error('Error saving history:', error);
      throw error;
    }
  }, []);

  // Reload history
  const reload = useCallback(async () => {
    try {
      const loadedHistory = await getHistory();
      setHistory(loadedHistory);
    } catch (error) {
      console.error('Error reloading history:', error);
      throw error;
    }
  }, []);

  return [history, addItem, save, reload];
}

/**
 * Hook for managing favorites in Chrome storage
 */
export function useFavorites(): [
  FavoriteComment[],
  (comment: FavoriteComment) => Promise<void>,
  (commentId: string) => Promise<void>,
  (commentId: string) => Promise<boolean>,
  () => Promise<void>
] {
  const [favorites, setFavorites] = useState<FavoriteComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites on mount
  useEffect(() => {
    async function load() {
      try {
        const loadedFavorites = await getFavorites();
        setFavorites(loadedFavorites);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Add favorite
  const add = useCallback(async (comment: FavoriteComment) => {
    try {
      await addFavorite(comment);
      setFavorites(prev => [...prev, comment]);
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }, []);

  // Remove favorite
  const remove = useCallback(async (commentId: string) => {
    try {
      await removeFavorite(commentId);
      setFavorites(prev => prev.filter(f => f.id !== commentId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }, []);

  // Check if comment is favorite
  const isFavorite = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      return await checkIsFavorite(commentId);
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }, []);

  // Reload favorites
  const reload = useCallback(async () => {
    try {
      const loadedFavorites = await getFavorites();
      setFavorites(loadedFavorites);
    } catch (error) {
      console.error('Error reloading favorites:', error);
      throw error;
    }
  }, []);

  return [favorites, add, remove, isFavorite, reload];
}

/**
 * Hook for listening to storage changes
 */
export function useStorageListener(
  key: StorageKeys,
  callback: (newValue: any, oldValue: any) => void
): void {
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if ((area === 'local' || area === 'sync') && changes[key]) {
        callback(changes[key].newValue, changes[key].oldValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [key, callback]);
}

/**
 * Hook for getting current theme
 */
export function useTheme(): [string, (theme: string) => Promise<void>] {
  const [settings] = useSettings();
  const theme = settings.theme || 'system';

  const setTheme = useCallback(async (newTheme: string) => {
    // Always merge into the latest stored settings to avoid wiping API keys
    const current = await getSettings();
    await saveSettings({ ...current, theme: newTheme as any });
  }, []);

  return [theme, setTheme];
}

/**
 * Hook for getting current tab info
 */
export function useCurrentTab(): [chrome.tabs.Tab | null, () => Promise<void>] {
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);

  const refreshTab = useCallback(async () => {
    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      setTab(currentTab || null);
    } catch (error) {
      console.error('Error getting current tab:', error);
    }
  }, []);

  useEffect(() => {
    refreshTab();
  }, [refreshTab]);

  return [tab, refreshTab];
}
