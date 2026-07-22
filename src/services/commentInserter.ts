import { Platform } from '@types';
import { getPlatformFromUrl } from '@utils/helpers';

/**
 * Comment Inserter Service
 * Inserts generated comments into comment boxes on supported platforms
 */
export class CommentInserter {
  private platform: Platform = 'unknown';

  constructor() {
    this.platform = getPlatformFromUrl(window.location.href);
  }

  /**
   * Insert comment into the active comment box
   */
  insertComment(comment: string): boolean {
    switch (this.platform) {
      case 'youtube':
        return this.insertYouTubeComment(comment);
      case 'linkedin':
        return this.insertLinkedInComment(comment);
      case 'x':
      case 'twitter':
        return this.insertTwitterComment(comment);
      case 'reddit':
        return this.insertRedditComment(comment);
      default:
        return this.insertGenericComment(comment);
    }
  }

  /**
   * Insert comment on YouTube
   */
  private insertYouTubeComment(comment: string): boolean {
    try {
      // Find the comment box
      const commentBox = document.querySelector('ytd-commentbox #contenteditable-root') ||
                        document.querySelector('#contenteditable-root') ||
                        document.querySelector('div[contenteditable="true"]') ||
                        document.querySelector('textarea#content');

      if (commentBox) {
        // Focus and insert text
        (commentBox as HTMLElement).focus();
        
        if (commentBox.getAttribute('contenteditable') === 'true') {
          // For contenteditable elements
          const range = document.createRange();
          const selection = window.getSelection();
          
          range.selectNodeContents(commentBox);
          range.collapse(false);
          
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          
          // Insert text
          document.execCommand('insertText', false, comment);
          
          // Trigger input event for React/Vue components
          const event = new Event('input', { bubbles: true });
          commentBox.dispatchEvent(event);
        } else {
          // For textarea/input elements
          (commentBox as HTMLTextAreaElement).value = comment;
          
          // Trigger input event
          const event = new Event('input', { bubbles: true });
          commentBox.dispatchEvent(event);
        }
        
        return true;
      }

      // Try alternative selectors
      const alternativeCommentBox = document.querySelector('div[aria-label*="comment"]') ||
                                   document.querySelector('div[role="textbox"]');
      if (alternativeCommentBox) {
        (alternativeCommentBox as HTMLElement).focus();
        
        // Try to set innerText
        (alternativeCommentBox as HTMLElement).innerText = comment;
        
        // Trigger events
        const event = new Event('input', { bubbles: true });
        alternativeCommentBox.dispatchEvent(event);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error inserting YouTube comment:', error);
      return false;
    }
  }

  /**
   * Insert comment on LinkedIn
   */
  private insertLinkedInComment(comment: string): boolean {
    try {
      // Find the comment box
      const commentBox = document.querySelector('.comments-comment-texteditor') ||
                        document.querySelector('.feed-shared-external-video__comment') ||
                        document.querySelector('div[contenteditable="true"]') ||
                        document.querySelector('textarea.comments-comment-texteditor');

      if (commentBox) {
        (commentBox as HTMLElement).focus();
        
        if (commentBox.getAttribute('contenteditable') === 'true') {
          // For contenteditable elements
          const range = document.createRange();
          const selection = window.getSelection();
          
          range.selectNodeContents(commentBox);
          range.collapse(false);
          
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          
          document.execCommand('insertText', false, comment);
          
          // Trigger input event
          const event = new Event('input', { bubbles: true });
          commentBox.dispatchEvent(event);
        } else {
          (commentBox as HTMLTextAreaElement).value = comment;
          
          // Trigger input event
          const event = new Event('input', { bubbles: true });
          commentBox.dispatchEvent(event);
        }
        
        return true;
      }

      // Try LinkedIn's specific comment box
      const linkedInCommentBox = document.querySelector('[aria-label*="Write a comment"]') ||
                                document.querySelector('[data-test-id="comment-input"]');
      if (linkedInCommentBox) {
        (linkedInCommentBox as HTMLElement).focus();
        
        // Try different methods to set text
        if (linkedInCommentBox.getAttribute('contenteditable') === 'true') {
          (linkedInCommentBox as HTMLElement).innerText = comment;
        } else if (linkedInCommentBox instanceof HTMLTextAreaElement) {
          linkedInCommentBox.value = comment;
        } else {
          (linkedInCommentBox as HTMLElement).textContent = comment;
        }
        
        // Trigger events
        const event = new Event('input', { bubbles: true });
        linkedInCommentBox.dispatchEvent(event);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error inserting LinkedIn comment:', error);
      return false;
    }
  }

  /**
   * Insert comment on Twitter/X
   */
  private insertTwitterComment(comment: string): boolean {
    try {
      // Find the tweet/comment box
      const commentBox = document.querySelector('[aria-label*="Tweet text"]') ||
                        document.querySelector('[data-testid="tweetTextarea"]') ||
                        document.querySelector('div[role="textbox"]') ||
                        document.querySelector('div[contenteditable="true"]');

      if (commentBox) {
        (commentBox as HTMLElement).focus();
        
        if (commentBox.getAttribute('contenteditable') === 'true') {
          // For contenteditable elements
          const range = document.createRange();
          const selection = window.getSelection();
          
          range.selectNodeContents(commentBox);
          range.collapse(false);
          
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          
          document.execCommand('insertText', false, comment);
          
          // Trigger input event
          const event = new Event('input', { bubbles: true });
          commentBox.dispatchEvent(event);
        } else {
          (commentBox as HTMLTextAreaElement).value = comment;
          
          // Trigger input event
          const event = new Event('input', { bubbles: true });
          commentBox.dispatchEvent(event);
        }
        
        return true;
      }

      // Try Twitter's reply box
      const replyBox = document.querySelector('[data-testid="tweetReply"]') ||
                      document.querySelector('[aria-label*="Reply"]');
      if (replyBox) {
        (replyBox as HTMLElement).click();
        
        // Wait for the reply box to appear
        setTimeout(() => {
          const textarea = document.querySelector('[data-testid="tweetTextarea"]');
          if (textarea) {
            (textarea as HTMLTextAreaElement).value = comment;
            const event = new Event('input', { bubbles: true });
            textarea.dispatchEvent(event);
          }
        }, 500);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error inserting Twitter comment:', error);
      return false;
    }
  }

  /**
   * Insert comment on Reddit
   */
  private insertRedditComment(comment: string): boolean {
    try {
      // Find the comment box
      const commentBox = document.querySelector('textarea#text') ||
                        document.querySelector('div[contenteditable="true"]') ||
                        document.querySelector('[aria-label*="Comment"]') ||
                        document.querySelector('.CommentForm textarea');

      if (commentBox) {
        (commentBox as HTMLElement).focus();
        
        if (commentBox.getAttribute('contenteditable') === 'true') {
          // For contenteditable elements
          const range = document.createRange();
          const selection = window.getSelection();
          
          range.selectNodeContents(commentBox);
          range.collapse(false);
          
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          
          document.execCommand('insertText', false, comment);
          
          // Trigger input event
          const event = new Event('input', { bubbles: true });
          commentBox.dispatchEvent(event);
        } else {
          (commentBox as HTMLTextAreaElement).value = comment;
          
          // Trigger input event
          const event = new Event('input', { bubbles: true });
          commentBox.dispatchEvent(event);
        }
        
        return true;
      }

      // Try Reddit's specific comment box
      const redditCommentBox = document.querySelector('[name="text"]') ||
                              document.querySelector('.md textarea');
      if (redditCommentBox) {
        (redditCommentBox as HTMLTextAreaElement).value = comment;
        
        // Trigger events
        const event = new Event('input', { bubbles: true });
        redditCommentBox.dispatchEvent(event);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error inserting Reddit comment:', error);
      return false;
    }
  }

  /**
   * Insert comment on generic platforms
   */
  private insertGenericComment(comment: string): boolean {
    try {
      // Try to find any textarea
      const textareas = document.querySelectorAll('textarea');
      for (const textarea of textareas) {
        if (textarea.offsetParent !== null) { // Check if visible
          (textarea as HTMLTextAreaElement).value = comment;
          
          // Trigger input event
          const event = new Event('input', { bubbles: true });
          textarea.dispatchEvent(event);
          
          return true;
        }
      }

      // Try to find contenteditable elements
      const contentEditables = document.querySelectorAll('[contenteditable="true"]');
      for (const element of contentEditables) {
        if ((element as HTMLElement).offsetParent !== null) {
          (element as HTMLElement).focus();
          
          const range = document.createRange();
          const selection = window.getSelection();
          
          range.selectNodeContents(element);
          range.collapse(false);
          
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          
          document.execCommand('insertText', false, comment);
          
          // Trigger input event
          const event = new Event('input', { bubbles: true });
          element.dispatchEvent(event);
          
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error inserting generic comment:', error);
      return false;
    }
  }

  /**
   * Focus the comment box without inserting text
   */
  focusCommentBox(): boolean {
    try {
      switch (this.platform) {
        case 'youtube':
          return this.focusYouTubeCommentBox();
        case 'linkedin':
          return this.focusLinkedInCommentBox();
        case 'x':
        case 'twitter':
          return this.focusTwitterCommentBox();
        case 'reddit':
          return this.focusRedditCommentBox();
        default:
          return this.focusGenericCommentBox();
      }
    } catch (error) {
      console.error('Error focusing comment box:', error);
      return false;
    }
  }

  /**
   * Focus YouTube comment box
   */
  private focusYouTubeCommentBox(): boolean {
    const commentBox = document.querySelector('ytd-commentbox #contenteditable-root') ||
                      document.querySelector('#contenteditable-root') ||
                      document.querySelector('div[contenteditable="true"]');
    
    if (commentBox) {
      (commentBox as HTMLElement).focus();
      return true;
    }
    return false;
  }

  /**
   * Focus LinkedIn comment box
   */
  private focusLinkedInCommentBox(): boolean {
    const commentBox = document.querySelector('.comments-comment-texteditor') ||
                      document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('[aria-label*="Write a comment"]');
    
    if (commentBox) {
      (commentBox as HTMLElement).focus();
      return true;
    }
    return false;
  }

  /**
   * Focus Twitter comment box
   */
  private focusTwitterCommentBox(): boolean {
    const commentBox = document.querySelector('[aria-label*="Tweet text"]') ||
                      document.querySelector('[data-testid="tweetTextarea"]') ||
                      document.querySelector('div[role="textbox"]');
    
    if (commentBox) {
      (commentBox as HTMLElement).focus();
      return true;
    }
    return false;
  }

  /**
   * Focus Reddit comment box
   */
  private focusRedditCommentBox(): boolean {
    const commentBox = document.querySelector('textarea#text') ||
                      document.querySelector('div[contenteditable="true"]') ||
                      document.querySelector('[aria-label*="Comment"]');
    
    if (commentBox) {
      (commentBox as HTMLElement).focus();
      return true;
    }
    return false;
  }

  /**
   * Focus generic comment box
   */
  private focusGenericCommentBox(): boolean {
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
      if ((textarea as HTMLTextAreaElement).offsetParent !== null) {
        (textarea as HTMLTextAreaElement).focus();
        return true;
      }
    }

    const contentEditables = document.querySelectorAll('[contenteditable="true"]');
    for (const element of contentEditables) {
      if ((element as HTMLElement).offsetParent !== null) {
        (element as HTMLElement).focus();
        return true;
      }
    }

    return false;
  }
}

// Singleton instance
let commentInserterInstance: CommentInserter | null = null;

/**
 * Get the comment inserter instance
 */
export function getCommentInserter(): CommentInserter {
  if (!commentInserterInstance) {
    commentInserterInstance = new CommentInserter();
  }
  return commentInserterInstance;
}

/**
 * Reset the comment inserter instance
 */
export function resetCommentInserter(): void {
  commentInserterInstance = null;
}
