import { useState, useCallback, useEffect } from 'react';
import { 
  ExtractedContext, 
  GeneratedComment, 
  GenerationOptions,
  AIConfig
} from '@types';
import { getAIService, resetAIService } from '@services/aiService';
import { getSettings } from '@utils/storage';
import { useSettings } from './useStorage';

/**
 * Hook for AI comment generation
 */
export function useAI(): [
  (
    context: Partial<ExtractedContext>,
    options: GenerationOptions
  ) => Promise<GeneratedComment[]>,
  boolean,
  string | null,
  (config?: AIConfig) => Promise<{ ok: boolean; message: string }>,
  (config?: AIConfig) => Promise<{ models: string[]; error: string | null }>
] {
  const [settings] = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update AI service when settings change
  useEffect(() => {
    if (settings?.aiConfig) {
      resetAIService();
      getAIService(settings.aiConfig);
    }
  }, [settings?.aiConfig]);

  // Generate comments via background worker (reliable host access + shared config)
  const generateComments = useCallback(
    async (
      context: Partial<ExtractedContext>,
      options: GenerationOptions
    ): Promise<GeneratedComment[]> => {
      setIsLoading(true);
      setError(null);

      try {
        // Always refresh from storage so we use the latest saved API config
        const latestSettings = await getSettings();
        resetAIService();
        getAIService(latestSettings.aiConfig);

        if (!latestSettings.aiConfig?.apiKey || !latestSettings.aiConfig?.baseUrl) {
          throw new Error('AI is not configured. Please set up your API key and base URL in settings.');
        }

        const response = await chrome.runtime.sendMessage({
          type: 'GENERATE_COMMENT',
          data: { context, options },
        });

        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }

        if (response?.error) {
          throw new Error(response.error);
        }

        const comments = response?.data as GeneratedComment[] | undefined;

        if (!comments || !Array.isArray(comments) || comments.length === 0) {
          throw new Error('No comments were generated. Check your model and try again.');
        }

        return comments;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate comments';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Test AI connection using saved settings or an explicit draft config
  const testConnection = useCallback(async (config?: AIConfig): Promise<{ ok: boolean; message: string }> => {
    try {
      const latest = config || (await getSettings()).aiConfig;
      const aiService = getAIService(latest);
      return await aiService.testConnection(latest);
    } catch (error) {
      console.error('Connection test error:', error);
      const message = error instanceof Error ? error.message : 'Connection failed';
      return { ok: false, message };
    }
  }, []);

  // Get available models using saved settings or an explicit draft config
  const getModels = useCallback(async (
    config?: AIConfig
  ): Promise<{ models: string[]; error: string | null }> => {
    try {
      const latest = config || (await getSettings()).aiConfig;
      const aiService = getAIService(latest);
      return await aiService.getAvailableModels(latest);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load models';
      return { models: [], error: message };
    }
  }, []);

  return [generateComments, isLoading, error, testConnection, getModels];
}

/**
 * Hook for context extraction
 */
export function useContextExtraction(): [
  () => Promise<ExtractedContext>,
  boolean,
  string | null
] {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractContext = useCallback(async (): Promise<ExtractedContext> => {
    setIsLoading(true);
    setError(null);

    try {
      // Send message to background to extract context
      const response = await chrome.runtime.sendMessage({
        type: 'EXTRACT_CONTEXT',
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      return response?.data || {};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract context';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [extractContext, isLoading, error];
}

/**
 * Hook for comment insertion
 */
export function useCommentInsertion(): [
  (comment: string) => Promise<boolean>,
  boolean,
  string | null
] {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insertComment = useCallback(async (comment: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'INSERT_COMMENT',
        data: { comment },
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      return response?.data?.success || false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to insert comment';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [insertComment, isLoading, error];
}

/**
 * Hook for copying to clipboard
 */
export function useClipboard(): [
  (text: string) => Promise<boolean>,
  boolean,
  string | null
] {
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    setError(null);

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to copy to clipboard';
      setError(errorMessage);
      return false;
    }
  }, []);

  return [copyToClipboard, isCopied, error];
}

/**
 * Hook for debouncing
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
