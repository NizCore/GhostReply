import { Platform, Tone, Length, Language, ExtractedContext, GenerationOptions } from '@types';

/**
 * Prompt Builder Service
 * Builds optimized prompts for different platforms and use cases
 */
export class PromptBuilder {
  /**
   * Build a prompt for comment generation
   */
  buildCommentPrompt(
    context: Partial<ExtractedContext>,
    options: GenerationOptions
  ): string {
    const { tone, length, language } = options;
    const { platform, title, description, author, postContent, selectedText, url } = context;

    // Get platform-specific instructions
    const platformInstructions = this.getPlatformInstructions(platform || 'unknown');

    // Get tone instructions
    const toneInstructions = this.getToneInstructions(tone);

    // Get length instructions
    const lengthInstructions = this.getLengthInstructions(length);

    // Get language instructions
    const languageInstructions = this.getLanguageInstructions(language);

    // Build context section
    const contextSection = this.buildContextSection(context);

    // Build the final prompt
    const prompt = `You are an AI assistant specialized in generating natural, engaging comments for social media platforms.

${platformInstructions}

${toneInstructions}
${lengthInstructions}
${languageInstructions}

${contextSection}

Instructions:
- Generate a comment that fits naturally in the conversation
- Make it sound authentic and human-like
- Don't mention you're an AI or that this is AI-generated
- Don't include any disclaimers or apologies
- Don't reference the instructions above
- Return ONLY the comment text, nothing else

Generate the comment:`;

    return prompt;
  }

  /**
   * Build a prompt for reply generation (to a specific comment)
   */
  buildReplyPrompt(
    context: Partial<ExtractedContext>,
    options: GenerationOptions,
    parentComment: string
  ): string {
    const { tone, length, language } = options;
    const { platform, title, author, postContent } = context;

    // Get platform-specific instructions
    const platformInstructions = this.getPlatformInstructions(platform || 'unknown');

    // Get tone instructions
    const toneInstructions = this.getToneInstructions(tone);

    // Get length instructions
    const lengthInstructions = this.getLengthInstructions(length);

    // Get language instructions
    const languageInstructions = this.getLanguageInstructions(language);

    // Build context section
    const contextSection = this.buildContextSection(context);

    // Build the final prompt
    const prompt = `You are an AI assistant specialized in generating natural, engaging replies to comments on social media platforms.

${platformInstructions}

${toneInstructions}
${lengthInstructions}
${languageInstructions}

${contextSection}

Parent Comment to reply to:
"${parentComment}"

Instructions:
- Generate a reply that responds directly to the parent comment
- Make it sound authentic and human-like
- Address the points made in the parent comment
- Don't mention you're an AI or that this is AI-generated
- Don't include any disclaimers or apologies
- Don't reference the instructions above
- Return ONLY the reply text, nothing else

Generate the reply:`;

    return prompt;
  }

  /**
   * Build a prompt for multiple comment variations
   */
  buildMultipleCommentsPrompt(
    context: Partial<ExtractedContext>,
    options: GenerationOptions,
    count: number
  ): string {
    const { tone, length, language } = options;
    const { platform } = context;

    // Get platform-specific instructions
    const platformInstructions = this.getPlatformInstructions(platform || 'unknown');

    // Get tone instructions
    const toneInstructions = this.getToneInstructions(tone);

    // Get length instructions
    const lengthInstructions = this.getLengthInstructions(length);

    // Get language instructions
    const languageInstructions = this.getLanguageInstructions(language);

    // Build context section
    const contextSection = this.buildContextSection(context);

    // Build the final prompt
    const prompt = `You are an AI assistant specialized in generating natural, engaging comments for social media platforms.

${platformInstructions}

${toneInstructions}
${lengthInstructions}
${languageInstructions}

${contextSection}

Instructions:
- Generate ${count} different comments that fit naturally in the conversation
- Each comment should be unique and different from the others
- Make them sound authentic and human-like
- Don't mention you're an AI or that this is AI-generated
- Don't include any disclaimers or apologies
- Don't reference the instructions above
- Separate each comment with "---" on a new line
- Return ONLY the comments, nothing else

Generate ${count} comments:`;

    return prompt;
  }

  /**
   * Get platform-specific instructions
   */
  private getPlatformInstructions(platform: Platform): string {
    const platformInstructions: Record<Platform, string> = {
      youtube: 'This is for YouTube. Comments should be engaging, positive, and relevant to the video content. YouTube comments are typically casual and can include emojis.',
      linkedin: 'This is for LinkedIn. Comments should be professional, insightful, and add value to the discussion. LinkedIn comments are typically more formal and business-oriented.',
      x: 'This is for X (formerly Twitter). Comments should be concise, witty, and to the point. X comments are typically short and can include hashtags.',
      twitter: 'This is for Twitter. Comments should be concise, witty, and to the point. Twitter comments are typically short and can include hashtags.',
      reddit: 'This is for Reddit. Comments should be informative, engaging, and contribute to the discussion. Reddit comments can be more casual and may include references to other comments.',
      unknown: 'This is for a general social media platform. Comments should be engaging, relevant, and add value to the conversation.',
    };

    return platformInstructions[platform] || platformInstructions.unknown;
  }

  /**
   * Get tone-specific instructions
   */
  private getToneInstructions(tone: Tone): string {
    const toneInstructions: Record<Tone, string> = {
      professional: 'Use a professional tone. Be formal, respectful, and business-appropriate. Avoid slang and casual language.',
      friendly: 'Use a friendly tone. Be warm, welcoming, and approachable. Use positive language and emojis sparingly.',
      casual: 'Use a casual tone. Be relaxed and informal. Use everyday language and can include slang.',
      funny: 'Use a humorous tone. Be light-hearted, witty, and entertaining. Use humor appropriately.',
      insightful: 'Use an insightful tone. Be thoughtful, analytical, and perceptive. Provide valuable observations.',
      supportive: 'Use a supportive tone. Be encouraging, affirming, and positive. Show empathy and understanding.',
      formal: 'Use a formal tone. Be polished, sophisticated, and proper. Use complete sentences and proper grammar.',
      curious: 'Use a curious tone. Be inquisitive, thoughtful, and engaging. Ask questions and show interest.',
      critical: 'Use a critical tone. Be analytical, discerning, and evaluative. Provide constructive feedback.',
    };

    return `Tone: ${toneInstructions[tone] || 'Use a natural, engaging tone.'}`;
  }

  /**
   * Get length-specific instructions
   */
  private getLengthInstructions(length: Length): string {
    const lengthInstructions: Record<Length, string> = {
      very_short: 'Length: Very short (1-5 words). Be extremely concise.',
      short: 'Length: Short (5-15 words). Keep it brief and to the point.',
      medium: 'Length: Medium (15-50 words). Provide a substantial but not overly long comment.',
      long: 'Length: Long (50-150 words). Provide a detailed, thoughtful comment.',
    };

    return lengthInstructions[length] || 'Length: Natural length for the platform.';
  }

  /**
   * Get language-specific instructions
   */
  private getLanguageInstructions(language: Language): string {
    if (language === 'auto') {
      return 'Language: Use the same language as the context. Detect the language from the provided content.';
    }

    const languageNames: Record<Language, string> = {
      auto: 'the same language as the context',
      english: 'English',
      bangla: 'Bangla (Bengali)',
      spanish: 'Spanish',
      french: 'French',
      german: 'German',
      japanese: 'Japanese',
      chinese: 'Chinese',
      arabic: 'Arabic',
    };

    const languageName = languageNames[language] || 'English';
    return `Language: Write in ${languageName}.`;
  }

  /**
   * Build the context section of the prompt
   */
  private buildContextSection(context: Partial<ExtractedContext>): string {
    const { platform, title, description, author, postContent, selectedText, url, visibleText } = context;
    
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

    if (visibleText && !postContent && !selectedText) {
      contextParts.push(`Visible Text: "${visibleText.substring(0, 500)}"`);
    }

    if (contextParts.length === 0) {
      return 'Context: No specific context provided. Generate a general, engaging comment.';
    }

    return `Context:\n${contextParts.join('\n')}`;
  }

  /**
   * Build a system prompt for the AI
   */
  buildSystemPrompt(): string {
    return `You are GhostReply, an AI assistant that generates natural, engaging comments for social media platforms. 
Your goal is to create authentic, human-like comments that fit naturally in conversations. 
Never mention that you are an AI or that the comment is AI-generated. 
Always return only the comment text without any additional formatting or disclaimers.`;
  }

  /**
   * Build a prompt for testing the AI connection
   */
  buildTestPrompt(): string {
    return `You are a simple AI assistant. Respond with "Hello, I'm working!" and nothing else.`;
  }

  /**
   * Build a prompt for getting model information
   */
  buildModelInfoPrompt(): string {
    return `What model are you? Respond with only the model name and version.`;
  }
}

// Singleton instance
let promptBuilderInstance: PromptBuilder | null = null;

/**
 * Get the prompt builder instance
 */
export function getPromptBuilder(): PromptBuilder {
  if (!promptBuilderInstance) {
    promptBuilderInstance = new PromptBuilder();
  }
  return promptBuilderInstance;
}

/**
 * Reset the prompt builder instance
 */
export function resetPromptBuilder(): void {
  promptBuilderInstance = null;
}
