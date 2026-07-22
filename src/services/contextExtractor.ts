import { Platform, ExtractedContext } from '@types';
import { getPlatformFromUrl, sanitizeText, isValidText } from '@utils/helpers';

/**
 * Context Extractor Service
 * Extracts relevant content from social media pages
 */
export class ContextExtractor {
  private platform: Platform = 'unknown';
  private url: string = '';

  /**
   * Extract context from the current page
   */
  async extractContext(): Promise<ExtractedContext> {
    // Get current URL
    this.url = window.location.href;
    this.platform = getPlatformFromUrl(this.url);

    // Extract context based on platform
    switch (this.platform) {
      case 'youtube':
        return this.extractYouTubeContext();
      case 'linkedin':
        return this.extractLinkedInContext();
      case 'x':
      case 'twitter':
        return this.extractTwitterContext();
      case 'reddit':
        return this.extractRedditContext();
      default:
        return this.extractGenericContext();
    }
  }

  /**
   * Extract context from YouTube
   */
  private async extractYouTubeContext(): Promise<ExtractedContext> {
    const context: ExtractedContext = {
      platform: 'youtube',
      url: this.url,
      title: '',
      description: '',
      author: '',
      postContent: '',
      selectedText: this.getSelectedText(),
      visibleText: this.getVisibleText(),
    };

    try {
      // Extract video title
      const titleElement = document.querySelector('ytd-video-primary-info-renderer h1') ||
                          document.querySelector('h1.title') ||
                          document.querySelector('[itemprop="name"]');
      if (titleElement) {
        context.title = sanitizeText(titleElement.textContent || '');
      }

      // Extract video description
      const descriptionElement = document.querySelector('ytd-video-secondary-info-renderer #description') ||
                                document.querySelector('[itemprop="description"]') ||
                                document.querySelector('meta[name="description"]');
      if (descriptionElement) {
        context.description = sanitizeText(
          descriptionElement.textContent || 
          (descriptionElement as HTMLMetaElement).content || 
          ''
        );
      }

      // Extract author/channel name
      const authorElement = document.querySelector('ytd-video-owner-renderer a') ||
                           document.querySelector('[itemprop="author"]') ||
                           document.querySelector('meta[itemprop="author"]');
      if (authorElement) {
        context.author = sanitizeText(
          authorElement.textContent || 
          (authorElement as HTMLMetaElement).content || 
          ''
        );
      }

      // Extract video transcript if available
      const transcript = await this.extractYouTubeTranscript();
      if (transcript && isValidText(transcript)) {
        context.postContent = transcript;
      }

      // If no transcript, try to get the video description as post content
      if (!isValidText(context.postContent) && isValidText(context.description)) {
        context.postContent = context.description;
      }

      // Extract comments section
      const comments = this.extractYouTubeComments();
      if (comments && isValidText(comments)) {
        context.postContent = context.postContent ? 
          `${context.postContent}\n\nComments: ${comments}` :
          comments;
      }

    } catch (error) {
      console.error('Error extracting YouTube context:', error);
    }

    return context;
  }

  /**
   * Extract YouTube transcript
   */
  private async extractYouTubeTranscript(): Promise<string> {
    try {
      // Check if transcript is already loaded
      const transcriptElement = document.querySelector('ytd-transcript-body-renderer');
      if (transcriptElement) {
        const segments = transcriptElement.querySelectorAll('.segment');
        const transcriptParts: string[] = [];
        
        segments.forEach(segment => {
          const text = segment.querySelector('.segment-text')?.textContent || '';
          if (text) {
            transcriptParts.push(text);
          }
        });
        
        return transcriptParts.join(' ');
      }

      // Try to load transcript if not already loaded
      const transcriptButton = document.querySelector('button[aria-label*="transcript"]');
      if (transcriptButton) {
        (transcriptButton as HTMLElement).click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.extractYouTubeTranscript();
      }

      return '';
    } catch (error) {
      console.error('Error extracting YouTube transcript:', error);
      return '';
    }
  }

  /**
   * Extract YouTube comments
   */
  private extractYouTubeComments(): string {
    try {
      const commentElements = document.querySelectorAll('ytd-comment-renderer');
      const comments: string[] = [];

      commentElements.forEach(comment => {
        const textElement = comment.querySelector('#content-text');
        if (textElement) {
          const text = sanitizeText(textElement.textContent || '');
          if (isValidText(text)) {
            comments.push(text);
          }
        }
      });

      return comments.slice(0, 5).join('\n\n'); // Limit to 5 comments
    } catch (error) {
      console.error('Error extracting YouTube comments:', error);
      return '';
    }
  }

  /**
   * Extract context from LinkedIn
   */
  private extractLinkedInContext(): ExtractedContext {
    const context: ExtractedContext = {
      platform: 'linkedin',
      url: this.url,
      title: '',
      description: '',
      author: '',
      postContent: '',
      selectedText: this.getSelectedText(),
      visibleText: this.getVisibleText(),
    };

    try {
      // Extract post title
      const titleElement = document.querySelector('h1') ||
                          document.querySelector('.feed-shared-update-v2__title') ||
                          document.querySelector('[data-test-id="post-title"]');
      if (titleElement) {
        context.title = sanitizeText(titleElement.textContent || '');
      }

      // Extract post content
      const contentElement = document.querySelector('.feed-shared-update-v2__description') ||
                             document.querySelector('.feed-shared-update-v2__commentary') ||
                             document.querySelector('[data-test-id="post-content"]') ||
                             document.querySelector('.update-components-text');
      if (contentElement) {
        context.postContent = sanitizeText(contentElement.textContent || '');
      }

      // Extract author
      const authorElement = document.querySelector('.feed-shared-update-v2__member') ||
                           document.querySelector('[data-test-id="post-author"]') ||
                           document.querySelector('.update-components-actor__name');
      if (authorElement) {
        context.author = sanitizeText(authorElement.textContent || '');
      }

      // Extract article content if it's an article
      if (this.url.includes('/pulse/') || this.url.includes('/article/')) {
        const articleContent = document.querySelector('.article-body') ||
                               document.querySelector('.blog-shared-article-body');
        if (articleContent) {
          context.postContent = sanitizeText(articleContent.textContent || '');
        }
      }

      // If no title but we have post content, use first line as title
      if (!isValidText(context.title) && isValidText(context.postContent)) {
        const firstLine = context.postContent.split('\n')[0];
        context.title = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
      }

    } catch (error) {
      console.error('Error extracting LinkedIn context:', error);
    }

    return context;
  }

  /**
   * Extract context from Twitter/X
   */
  private extractTwitterContext(): ExtractedContext {
    const context: ExtractedContext = {
      platform: this.url.includes('x.com') ? 'x' : 'twitter',
      url: this.url,
      title: '',
      description: '',
      author: '',
      postContent: '',
      selectedText: this.getSelectedText(),
      visibleText: this.getVisibleText(),
    };

    try {
      // Extract tweet content
      const tweetElement = document.querySelector('[data-testid="tweetText"]') ||
                          document.querySelector('.tweet-text') ||
                          document.querySelector('[data-testid="tweet"]');
      if (tweetElement) {
        context.postContent = sanitizeText(tweetElement.textContent || '');
      }

      // Extract author
      const authorElement = document.querySelector('[data-testid="User-Name"]') ||
                           document.querySelector('.tweet-author') ||
                           document.querySelector('[data-testid="UserName"]');
      if (authorElement) {
        context.author = sanitizeText(authorElement.textContent || '');
      }

      // Extract tweet details (username, etc.)
      const usernameElement = document.querySelector('[data-testid="User-Handle"]') ||
                             document.querySelector('.tweet-user-info');
      if (usernameElement && !isValidText(context.author)) {
        context.author = sanitizeText(usernameElement.textContent || '');
      }

      // For tweet detail pages, extract the main tweet
      if (this.url.includes('/status/')) {
        const mainTweet = document.querySelector('article[data-testid="tweet"]');
        if (mainTweet) {
          const textElement = mainTweet.querySelector('[data-testid="tweetText"]');
          if (textElement) {
            context.postContent = sanitizeText(textElement.textContent || '');
          }
        }
      }

      // Extract thread context
      const threadTweets = document.querySelectorAll('[data-testid="tweet"]');
      if (threadTweets.length > 1) {
        const threadContent: string[] = [];
        threadTweets.forEach(tweet => {
          const textElement = tweet.querySelector('[data-testid="tweetText"]');
          if (textElement) {
            const text = sanitizeText(textElement.textContent || '');
            if (isValidText(text)) {
              threadContent.push(text);
            }
          }
        });
        
        if (threadContent.length > 0) {
          context.postContent = threadContent.join('\n\n');
        }
      }

      // Use first line as title if available
      if (isValidText(context.postContent) && !isValidText(context.title)) {
        const firstLine = context.postContent.split('\n')[0];
        context.title = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
      }

    } catch (error) {
      console.error('Error extracting Twitter context:', error);
    }

    return context;
  }

  /**
   * Extract context from Reddit
   */
  private extractRedditContext(): ExtractedContext {
    const context: ExtractedContext = {
      platform: 'reddit',
      url: this.url,
      title: '',
      description: '',
      author: '',
      postContent: '',
      selectedText: this.getSelectedText(),
      visibleText: this.getVisibleText(),
    };

    try {
      // Extract post title
      const titleElement = document.querySelector('h1') ||
                          document.querySelector('.title') ||
                          document.querySelector('[data-testid="post-title"]') ||
                          document.querySelector('._eYtD2XCVieq6emjKBH3m');
      if (titleElement) {
        context.title = sanitizeText(titleElement.textContent || '');
      }

      // Extract post content
      const contentElement = document.querySelector('.post-content') ||
                             document.querySelector('.usertext-body') ||
                             document.querySelector('[data-testid="post-content"]') ||
                             document.querySelector('._1qeIAgB0cPwnLhDF9XSiJM');
      if (contentElement) {
        context.postContent = sanitizeText(contentElement.textContent || '');
      }

      // Extract author
      const authorElement = document.querySelector('.author') ||
                           document.querySelector('[data-testid="post-author"]') ||
                           document.querySelector('._2tbHP6ZydRpI6l8J3O60u');
      if (authorElement) {
        context.author = sanitizeText(authorElement.textContent || '');
      }

      // Extract subreddit
      const subredditElement = document.querySelector('.subreddit') ||
                              document.querySelector('[data-testid="subreddit-name"]') ||
                              document.querySelector('._39I42pCzPELHf57cg1S2g');
      if (subredditElement) {
        if (!isValidText(context.author)) {
          context.author = sanitizeText(subredditElement.textContent || '');
        } else {
          context.description = `Subreddit: ${sanitizeText(subredditElement.textContent || '')}`;
        }
      }

      // Extract comments
      const comments = this.extractRedditComments();
      if (comments && isValidText(comments)) {
        context.postContent = context.postContent ? 
          `${context.postContent}\n\nComments: ${comments}` :
          comments;
      }

    } catch (error) {
      console.error('Error extracting Reddit context:', error);
    }

    return context;
  }

  /**
   * Extract Reddit comments
   */
  private extractRedditComments(): string {
    try {
      const commentElements = document.querySelectorAll('.comment') ||
                             document.querySelectorAll('[data-testid="comment"]') ||
                             document.querySelectorAll('._1qeIAgB0cPwnLhDF9XSiJM');
      const comments: string[] = [];

      commentElements.forEach(comment => {
        const textElement = comment.querySelector('.usertext-body') ||
                           comment.querySelector('[data-testid="comment-content"]');
        if (textElement) {
          const text = sanitizeText(textElement.textContent || '');
          if (isValidText(text)) {
            comments.push(text);
          }
        }
      });

      return comments.slice(0, 5).join('\n\n'); // Limit to 5 comments
    } catch (error) {
      console.error('Error extracting Reddit comments:', error);
      return '';
    }
  }

  /**
   * Extract generic context for unsupported platforms
   */
  private extractGenericContext(): ExtractedContext {
    const context: ExtractedContext = {
      platform: this.platform,
      url: this.url,
      title: '',
      description: '',
      author: '',
      postContent: '',
      selectedText: this.getSelectedText(),
      visibleText: this.getVisibleText(),
    };

    try {
      // Extract page title
      const titleElement = document.querySelector('title') ||
                          document.querySelector('h1');
      if (titleElement) {
        context.title = sanitizeText(
          titleElement.textContent || 
          (titleElement as HTMLTitleElement).text || 
          ''
        );
      }

      // Extract meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        context.description = sanitizeText((metaDescription as HTMLMetaElement).content || '');
      }

      // Extract main content
      const mainContent = document.querySelector('main') ||
                          document.querySelector('article') ||
                          document.querySelector('.main-content') ||
                          document.querySelector('body');
      if (mainContent) {
        context.postContent = sanitizeText(mainContent.textContent || '');
      }

      // Extract author if available
      const authorMeta = document.querySelector('meta[name="author"]');
      if (authorMeta) {
        context.author = sanitizeText((authorMeta as HTMLMetaElement).content || '');
      }

    } catch (error) {
      console.error('Error extracting generic context:', error);
    }

    return context;
  }

  /**
   * Get currently selected text
   */
  private getSelectedText(): string {
    try {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        return sanitizeText(selection.toString());
      }
      return '';
    } catch (error) {
      console.error('Error getting selected text:', error);
      return '';
    }
  }

  /**
   * Get visible text from the page
   */
  private getVisibleText(): string {
    try {
      // Get all text content from body
      const bodyText = document.body.textContent || '';
      
      // Clean up the text
      const cleanedText = bodyText
        .replace(/\s+/g, ' ')
        .replace(/[\n\r\t]/g, ' ')
        .trim();
      
      // Limit to first 2000 characters to avoid excessive data
      return cleanedText.substring(0, 2000);
    } catch (error) {
      console.error('Error getting visible text:', error);
      return '';
    }
  }

  /**
   * Extract context from selected text only
   */
  extractFromSelectedText(): ExtractedContext {
    const selectedText = this.getSelectedText();
    
    return {
      platform: this.platform,
      url: this.url,
      title: '',
      description: '',
      author: '',
      postContent: selectedText,
      selectedText: selectedText,
      visibleText: '',
    };
  }
}

// Singleton instance
let contextExtractorInstance: ContextExtractor | null = null;

/**
 * Get the context extractor instance
 */
export function getContextExtractor(): ContextExtractor {
  if (!contextExtractorInstance) {
    contextExtractorInstance = new ContextExtractor();
  }
  return contextExtractorInstance;
}

/**
 * Reset the context extractor instance
 */
export function resetContextExtractor(): void {
  contextExtractorInstance = null;
}
