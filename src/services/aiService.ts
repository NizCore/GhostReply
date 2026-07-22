import { AIConfig, ExtractedContext, GenerationOptions, GeneratedComment, Platform, Tone, Length, Language } from '@types';
import { generateId, sanitizeText } from '@utils/helpers';

/**
 * AI Service for generating comments using OpenAI compatible APIs
 */
export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  /**
   * Update AI configuration
   */
  updateConfig(config: AIConfig): void {
    this.config = config;
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
      content: sanitizeText(content),
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

    // Build the prompt
    const prompt = `You are an AI assistant that generates natural, engaging comments for social media platforms.${contextString}

Requirements:
- Write in a ${toneDescription} tone
- ${lengthDescription}
- ${languageInstruction}
- Be natural and authentic
- Match the platform's style
- Don't mention you're an AI
- Don't include any disclaimers
- Return only the comment text, nothing else

Generate a comment based on the context above.`;

    return prompt;
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

    // For multiple comments, we'll make separate requests or use a single request with n parameter
    // Most OpenAI compatible APIs support the n parameter for multiple completions
    
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates social media comments.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature,
          max_tokens: maxTokens,
          n: Math.min(count, 5), // Most APIs limit n to 5
          stop: ['\n\n', '<|im_end|>', '<|im_start|>'],
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
      
      // Extract comments from the response
      const comments: string[] = [];
      
      if (data.choices && Array.isArray(data.choices)) {
        for (const choice of data.choices) {
          if (choice.message?.content) {
            comments.push(choice.message.content);
          }
        }
      }

      // If we requested more comments than the API returned, generate additional ones
      if (comments.length < count) {
        const additionalComments = await this.generateAdditionalComments(
          prompt,
          count - comments.length,
          context,
          options
        );
        comments.push(...additionalComments);
      }

      return comments.slice(0, count);
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }

  /**
   * Generate additional comments if the API didn't return enough
   */
  private async generateAdditionalComments(
    prompt: string,
    count: number,
    context: Partial<ExtractedContext>,
    options: GenerationOptions
  ): Promise<string[]> {
    const comments: string[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        // Add a slight variation to the prompt to get different results
        const variedPrompt = `${prompt}\n\nNote: This should be different from previous comments.`;
        
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that generates social media comments.',
              },
              {
                role: 'user',
                content: variedPrompt,
              },
            ],
            temperature: this.config.temperature + 0.1, // Slightly increase temperature for variation
            max_tokens: this.config.maxTokens,
            n: 1,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          comments.push(data.choices[0].message.content);
        }
      } catch (error) {
        console.error('Error generating additional comment:', error);
        // Add a fallback comment
        comments.push(this.generateFallbackComment(context, options));
      }
    }

    return comments;
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
   * Test the AI API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Connection test error:', error);
      return false;
    }
  }

  /**
   * Get available models from the API
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const models: string[] = [];

      if (data.data && Array.isArray(data.data)) {
        for (const item of data.data) {
          if (item.id) {
            models.push(item.id);
          }
        }
      }

      return models;
    } catch (error) {
      console.error('Error getting models:', error);
      return [];
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
