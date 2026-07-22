import { useState, useCallback, useEffect } from 'react';
import { 
  ExtractedContext, 
  GeneratedComment, 
  GenerationOptions,
  AIConfig
} from '@types';
import { getAIService, resetAIService } from '@services/aiService';
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
  () => Promise<boolean>,
  () => Promise<string[]>
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

  // Generate comments
  const generateComments = useCallback(
    async (
      context: Partial<ExtractedContext>,
      options: GenerationOptions
    ): Promise<GeneratedComment[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const aiService = getAIService();
        
        if (!aiService.isConfigured()) {
          throw new Error('AI is not configured. Please set up your API key and base URL in settings.');
        }

        const comments = await aiService.generateComments(context, options);
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

  // Test AI connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const aiService = getAIService();
      return await aiService.testConnection();
    } catch (error) {
      console.error('Connection test error:', error);
      return false;
    }
  }, []);

  // Get available models
  const getModels = useCallback(async (): Promise<string[]> => {
    try {
      const aiService = getAIService();
      return await aiService.getAvailableModels();
    } catch (error) {
      console.error('Error getting models:', error);
      return [];
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
