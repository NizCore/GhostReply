import { AIConfig, ExtractedContext, GenerationOptions, GeneratedComment, Platform, Tone, Length, Language } from '@types';
import { generateId, sanitizeText } from '@utils/helpers';

/**
 * Normalize OpenAI-compatible base URLs.
 * Accepts either `https://host/v1` or a full `.../chat/completions` URL.
 */
function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  return trimmed
    .replace(/\/chat\/completions$/i, '')
    .replace(/\/responses$/i, '')
    .replace(/\/messages$/i, '');
}

/**
 * Clean pasted API keys (quotes, accidental Bearer prefix, whitespace).
 */
function normalizeApiKey(apiKey: string): string {
  return apiKey
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^Bearer\s+/i, '')
    .trim();
}

/**
 * Extract text content from OpenAI-compatible chat completion choices.
 */
function extractChoiceContent(choice: any): string | null {
  if (!choice) return null;

  const raw =
    choice.message?.content ??
    choice.delta?.content ??
    choice.text ??
    choice.content;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed || null;
  }

  if (Array.isArray(raw)) {
    const joined = raw
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part?.text) return part.text;
        if (part?.content) return part.content;
        return '';
      })
      .join('')
      .trim();
    return joined || null;
  }

  if (raw && typeof raw === 'object' && typeof raw.text === 'string') {
    const trimmed = raw.text.trim();
    return trimmed || null;
  }

  return null;
}

const REQUEST_TIMEOUT_MS = 90000;

/**
 * Fetch with timeout for slow OpenAI-compatible gateways.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s. Try again or switch model.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * AI Service for generating comments using OpenAI compatible APIs
 */
export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = this.normalizeConfig(config);
  }

  /**
   * Update AI configuration
   */
  updateConfig(config: AIConfig): void {
    this.config = this.normalizeConfig(config);
  }

  private normalizeConfig(config: AIConfig): AIConfig {
    return {
      ...config,
      baseUrl: normalizeBaseUrl(config.baseUrl || ''),
      apiKey: normalizeApiKey(config.apiKey || ''),
      model: (config.model || '').trim(),
    };
  }

  private getAuthHeaders(config: AIConfig = this.config): HeadersInit {
    return {
      Authorization: `Bearer ${config.apiKey}`,
    };
  }

  private getJsonHeaders(config: AIConfig = this.config): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    };
  }

  /**
   * Generate comments based on context and options
   */
  async generateComments(
    context: Partial<ExtractedContext>,
    options: GenerationOptions
  ): Promise<GeneratedComment[]> {
    const { tone, length, language, count } = options;
    const platform = context.platform || 'unknown';

    // Build the prompt
    const prompt = this.buildPrompt(context, options);

    // Generate comments using the AI model
    const comments = await this.generateWithAI(prompt, count, context, options);

    // Format the comments
    return comments.map((content, index) => ({
      id: generateId(),
      content: sanitizeText(content).replace(/^["'“”]+|["'“”]+$/g, '').trim(),
      tone,
      length,
      language,
      timestamp: Date.now(),
      platform,
    }));
  }

  /**
   * Build the prompt for the AI model
   */
  private buildPrompt(
    context: Partial<ExtractedContext>,
    options: GenerationOptions
  ): string {
    const { tone, length, language } = options;
    const { platform, title, description, author, postContent, selectedText, url } = context;

    // Get tone description
    const toneDescription = this.getToneDescription(tone);

    // Get length description
    const lengthDescription = this.getLengthDescription(length);

    // Get language instruction
    const languageInstruction = this.getLanguageInstruction(language);

    // Build context string
    const contextParts: string[] = [];
    
    if (platform && platform !== 'unknown') {
      contextParts.push(`Platform: ${platform}`);
    }
    
    if (title) {
      contextParts.push(`Title: "${title}"`);
    }
    
    if (description) {
      contextParts.push(`Description: "${description}"`);
    }
    
    if (author) {
      contextParts.push(`Author: ${author}`);
    }
    
    if (postContent) {
      contextParts.push(`Post Content: "${postContent}"`);
    }
    
    if (selectedText) {
      contextParts.push(`Selected Text: "${selectedText}"`);
    }
    
    if (url) {
      contextParts.push(`URL: ${url}`);
    }

    const contextString = contextParts.length > 0 
      ? `\n\nContext:\n${contextParts.join('\n')}` 
      : '';

    const platformStyle = this.getPlatformCommenterStyle(platform);

    // Build the prompt — write AS a real commenter, not about generating comments
    const prompt = `You are a real person scrolling ${platform && platform !== 'unknown' ? platform : 'social media'} and leaving a comment under a post. You are NOT an AI, assistant, marketer, or brand voice.
${contextString}

Write ONE comment from a human commenter's point of view.

Style:
- Sound like a real person reacting to this specific post (opinion, reaction, question, or short take)
- Tone: ${toneDescription}
- ${lengthDescription}
- ${languageInstruction}
- ${platformStyle}
- Use natural everyday language; contractions are fine
- React to concrete details from the post when possible (not generic praise)

Hard rules:
- Do NOT say you are an AI, a bot, or that you generated this
- Do NOT use corporate filler like "Great insights!", "Looking forward to the impact", "This resonates", "Thanks for sharing!" unless it truly fits
- Do NOT add hashtags, emojis spam, disclaimers, titles, labels, or quotation marks around the whole comment
- Do NOT write like a LinkedIn influencer pitch or a press release
- Return ONLY the comment text`;

    return prompt;
  }

  /**
   * Platform-specific "how real commenters write here" guidance
   */
  private getPlatformCommenterStyle(platform?: string): string {
    switch (platform) {
      case 'youtube':
        return 'YouTube style: casual, direct, can be short; react to the video topic, not "great video" alone';
      case 'linkedin':
        return 'LinkedIn style: thoughtful but still human; avoid buzzword soup and fake inspiration';
      case 'x':
      case 'twitter':
        return 'X/Twitter style: punchy, conversational, one clear thought';
      case 'reddit':
        return 'Reddit style: straightforward, specific, can be witty or blunt; no corporate speak';
      default:
        return 'Match normal comment-section style for the site';
    }
  }

  /**
   * Generate comments using the AI API
   */
  private async generateWithAI(
    prompt: string,
    count: number,
    context: Partial<ExtractedContext>,
    options: GenerationOptions
  ): Promise<string[]> {
    const { model, temperature, maxTokens, baseUrl, apiKey } = this.config;

    if (!apiKey || !baseUrl) {
      throw new Error('API key and base URL are required');
    }

    const endpoint = `${normalizeBaseUrl(baseUrl)}/chat/completions`;
    const comments: string[] = [];
    const targetCount = Math.max(1, Math.min(count, 5));

    // Request one completion at a time — many OpenAI-compatible routers
    // (including Bynara) do not reliably support the `n` parameter.
    for (let i = 0; i < targetCount; i++) {
      const userPrompt =
        i === 0
          ? prompt
          : `${prompt}\n\nNote: Write a different variation from previous comments.`;

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: this.getJsonHeaders(),
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'You write social media comments as a real human commenter. Output only the comment text—no quotes, labels, or explanations.',
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: Math.min(2, temperature + i * 0.1),
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `AI API error: ${response.status} ${response.statusText}` +
          (errorData.error?.message ? ` - ${errorData.error.message}` : '')
        );
      }

      const data = await response.json();
      let extracted: string | null = null;

      if (Array.isArray(data.choices)) {
        for (const choice of data.choices) {
          extracted = extractChoiceContent(choice);
          if (extracted) break;
        }
      }

      if (!extracted && typeof data.content === 'string') {
        extracted = data.content.trim() || null;
      }

      if (extracted) {
        comments.push(extracted);
      } else {
        console.warn('AI response had no usable content:', data);
        throw new Error(
          'AI returned an empty response. Check the model id and try again.'
        );
      }
    }

    return comments;
  }

  /**
   * @deprecated Kept for compatibility — generation now loops in generateWithAI
   */
  private async generateAdditionalComments(
    prompt: string,
    count: number,
    context: Partial<ExtractedContext>,
    options: GenerationOptions
  ): Promise<string[]> {
    return this.generateWithAI(prompt, count, context, options);
  }

  /**
   * Generate a fallback comment when AI fails
   */
  private generateFallbackComment(
    context: Partial<ExtractedContext>,
    options: GenerationOptions
  ): string {
    const { tone, length } = options;
    const { platform, title } = context;

    const toneResponses: Record<Tone, string[]> = {
      professional: [
        'This is very insightful. Thank you for sharing.',
        'I appreciate your perspective on this matter.',
        'Well said. This adds valuable context to the discussion.',
        'Your analysis is spot on. Great contribution.',
      ],
      friendly: [
        'Great post! I really enjoyed reading this.',
        'Thanks for sharing this! Very interesting.',
        'I love this! So glad I came across it.',
        'Awesome content! Keep it up!',
      ],
      casual: [
        'Nice! This is cool.',
        'Sweet! Thanks for posting.',
        'This is dope. Good stuff.',
        'Love it! More please.',
      ],
      funny: [
        'This made me LOL. Great job!',
        'I laughed, I cried, it was better than Cats.',
        'This is hilarious! My sides hurt.',
        'ROFL! Thanks for the laugh.',
      ],
      insightful: [
        'This provides excellent food for thought.',
        'Your analysis is deeply perceptive.',
        'This offers a fresh perspective I hadn\'t considered.',
        'Very thoughtful commentary. Well done.',
      ],
      supportive: [
        'I completely agree with you.',
        'You\'re absolutely right about this.',
        'This resonates with me deeply.',
        'I\'m with you 100% on this.',
      ],
      formal: [
        'I would like to commend you on this excellent post.',
        'Your contribution to this discussion is most welcome.',
        'This is a well-reasoned argument.',
        'I appreciate the time you took to write this.',
      ],
      curious: [
        'This raises some interesting questions.',
        'I\'d love to hear more about this.',
        'What are your thoughts on...?',
        'This makes me wonder...',
      ],
      critical: [
        'This is an important critique.',
        'You raise valid concerns.',
        'This analysis is quite thorough.',
        'Well-argued points.',
      ],
    };

    const lengthMultipliers: Record<Length, number> = {
      very_short: 1,
      short: 1,
      medium: 2,
      long: 3,
    };

    const platformPrefixes: Record<Platform, string> = {
      youtube: 'Great video! ',
      linkedin: 'Excellent post! ',
      x: '',
      twitter: '',
      reddit: '',
      unknown: '',
    };

    const toneResponsesForTone = toneResponses[tone] || toneResponses.friendly;
    const prefix = platform ? platformPrefixes[platform] || '' : '';
    const multiplier = lengthMultipliers[length] || 1;
    
    // Combine multiple responses for longer comments
    const responses = [];
    for (let i = 0; i < multiplier && i < toneResponsesForTone.length; i++) {
      responses.push(toneResponsesForTone[i]);
    }
    
    return prefix + responses.join(' ');
  }

  /**
   * Get tone description for prompt
   */
  private getToneDescription(tone: Tone): string {
    const toneDescriptions: Record<Tone, string> = {
      professional: 'professional and business-appropriate',
      friendly: 'warm, welcoming, and approachable',
      casual: 'relaxed and informal',
      funny: 'humorous and light-hearted',
      insightful: 'thoughtful, analytical, and perceptive',
      supportive: 'encouraging, affirming, and positive',
      formal: 'formal, polished, and sophisticated',
      curious: 'inquisitive, thoughtful, and engaging',
      critical: 'analytical, discerning, and evaluative',
    };
    return toneDescriptions[tone] || 'natural and engaging';
  }

  /**
   * Get length description for prompt
   */
  private getLengthDescription(length: Length): string {
    const lengthDescriptions: Record<Length, string> = {
      very_short: 'Keep it very brief (1-5 words)',
      short: 'Keep it concise (5-15 words)',
      medium: 'Make it substantial (15-50 words)',
      long: 'Make it detailed (50-150 words)',
    };
    return lengthDescriptions[length] || 'Write a natural length comment';
  }

  /**
   * Get language instruction for prompt
   */
  private getLanguageInstruction(language: Language): string {
    if (language === 'auto') {
      return 'Write in the same language as the context';
    }

    const languageNames: Record<Language, string> = {
      auto: 'the same language as the context',
      english: 'English',
      bangla: 'Bangla',
      spanish: 'Spanish',
      french: 'French',
      german: 'German',
      japanese: 'Japanese',
      chinese: 'Chinese',
      arabic: 'Arabic',
    };

    return `Write in ${languageNames[language] || 'English'}`;
  }

  /**
   * Check if API configuration is valid
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.baseUrl);
  }

  /**
   * Test the AI API connection.
   * Prefers a minimal chat/completions ping (what GhostReply actually uses),
   * and optionally lists models when available.
   */
  async testConnection(configOverride?: AIConfig): Promise<{ ok: boolean; message: string }> {
    const config = this.normalizeConfig(configOverride || this.config);

    if (!config.apiKey || !config.baseUrl) {
      return { ok: false, message: 'API key and base URL are required' };
    }

    if (!config.model) {
      return { ok: false, message: 'Enter a model id before testing the connection' };
    }

    try {
      // Test the endpoint GhostReply actually uses for generation
      const chatResponse = await fetchWithTimeout(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getJsonHeaders(config),
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
      }, 30000);

      if (chatResponse.ok) {
        return { ok: true, message: 'Connection successful!' };
      }

      const errorData = await chatResponse.json().catch(() => ({}));
      const apiMessage = errorData.error?.message || errorData.message;

      if (chatResponse.status === 401 || chatResponse.status === 403) {
        return {
          ok: false,
          message:
            apiMessage ||
            `Authentication failed (${chatResponse.status}). Check that your API key is valid and saved.`,
        };
      }

      return {
        ok: false,
        message:
          apiMessage ||
          `Connection failed (${chatResponse.status} ${chatResponse.statusText})`,
      };
    } catch (error) {
      console.error('Connection test error:', error);
      const message = error instanceof Error ? error.message : 'Unknown network error';
      return {
        ok: false,
        message: `Connection failed: ${message}. Check the base URL and extension host permissions.`,
      };
    }
  }

  /**
   * Get available models from the API.
   * Returns an empty list (with an error message) instead of throwing on auth/network failures.
   */
  async getAvailableModels(
    configOverride?: AIConfig
  ): Promise<{ models: string[]; error: string | null }> {
    const config = this.normalizeConfig(configOverride || this.config);

    if (!config.apiKey || !config.baseUrl) {
      return { models: [], error: 'API key and base URL are required' };
    }

    try {
      const response = await fetchWithTimeout(`${config.baseUrl}/models`, {
        method: 'GET',
        headers: this.getAuthHeaders(config),
      }, 20000);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiMessage = errorData.error?.message || errorData.message;

        if (response.status === 401 || response.status === 403) {
          return {
            models: [],
            error:
              apiMessage ||
              `Invalid API key (${response.status}). You can still type a model id manually.`,
          };
        }

        return {
          models: [],
          error:
            apiMessage ||
            `Could not list models (${response.status}). You can still type a model id manually.`,
        };
      }

      const data = await response.json();
      const models: string[] = [];

      if (data.data && Array.isArray(data.data)) {
        for (const item of data.data) {
          if (item.id) {
            models.push(item.id);
          }
        }
      } else if (Array.isArray(data)) {
        for (const item of data) {
          if (typeof item === 'string') models.push(item);
          else if (item?.id) models.push(item.id);
        }
      }

      return { models, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      return {
        models: [],
        error: `Could not list models: ${message}. You can still type a model id manually.`,
      };
    }
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

/**
 * Get the AI service instance
 */
export function getAIService(config?: AIConfig): AIService {
  if (!aiServiceInstance || config) {
    aiServiceInstance = new AIService(config || {
      baseUrl: '',
      apiKey: '',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 500,
    });
  }
  return aiServiceInstance;
}

/**
 * Reset the AI service instance (useful for testing or config changes)
 */
export function resetAIService(): void {
  aiServiceInstance = null;
}
