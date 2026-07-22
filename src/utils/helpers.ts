import { Platform, Tone, Length, Language, GeneratedComment } from '@types';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize text to prevent XSS and other issues
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format date for display
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  return date.toLocaleDateString();
}

/**
 * Format date for history items
 */
export function formatHistoryDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Get tone label from value
 */
export function getToneLabel(tone: Tone): string {
  const toneMap: Record<Tone, string> = {
    professional: 'Professional',
    friendly: 'Friendly',
    casual: 'Casual',
    funny: 'Funny',
    insightful: 'Insightful',
    supportive: 'Supportive',
    formal: 'Formal',
    curious: 'Curious',
    critical: 'Critical',
  };
  return toneMap[tone] || tone;
}

/**
 * Get length label from value
 */
export function getLengthLabel(length: Length): string {
  const lengthMap: Record<Length, string> = {
    very_short: 'Very Short',
    short: 'Short',
    medium: 'Medium',
    long: 'Long',
  };
  return lengthMap[length] || length;
}

/**
 * Get language label from value
 */
export function getLanguageLabel(language: Language): string {
  const languageMap: Record<Language, string> = {
    auto: 'Auto Detect',
    english: 'English',
    bangla: 'Bangla',
    spanish: 'Spanish',
    french: 'French',
    german: 'German',
    japanese: 'Japanese',
    chinese: 'Chinese',
    arabic: 'Arabic',
  };
  return languageMap[language] || language;
}

/**
 * Get platform label from value
 */
export function getPlatformLabel(platform: Platform): string {
  const platformMap: Record<Platform, string> = {
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    x: 'X',
    twitter: 'Twitter',
    reddit: 'Reddit',
    unknown: 'Unknown',
  };
  return platformMap[platform] || platform;
}

/**
 * Get platform from URL
 */
export function getPlatformFromUrl(url: string): Platform {
  if (!url) return 'unknown';
  
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  if (lowerUrl.includes('linkedin.com')) {
    return 'linkedin';
  }
  if (lowerUrl.includes('x.com') || lowerUrl.includes('twitter.com')) {
    return 'x';
  }
  if (lowerUrl.includes('reddit.com')) {
    return 'reddit';
  }
  
  return 'unknown';
}

/**
 * Get platform emoji
 */
export function getPlatformEmoji(platform: Platform): string {
  const emojiMap: Record<Platform, string> = {
    youtube: '📺',
    linkedin: '💼',
    x: '🐦',
    twitter: '🐦',
    reddit: '🔴',
    unknown: '🌐',
  };
  return emojiMap[platform] || '🌐';
}

/**
 * Get platform color
 */
export function getPlatformColor(platform: Platform): string {
  const colorMap: Record<Platform, string> = {
    youtube: '#FF0000',
    linkedin: '#0077B5',
    x: '#000000',
    twitter: '#1DA1F2',
    reddit: '#FF4500',
    unknown: '#64748b',
  };
  return colorMap[platform] || '#64748b';
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Sleep function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if text is valid (not empty or just whitespace)
 */
export function isValidText(text: string): boolean {
  return text && text.trim().length > 0;
}

/**
 * Get word count from text
 */
export function getWordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Get character count from text
 */
export function getCharacterCount(text: string): number {
  return text ? text.length : 0;
}

/**
 * Format comment length description
 */
export function formatCommentLength(comment: GeneratedComment): string {
  const wordCount = getWordCount(comment.content);
  const charCount = getCharacterCount(comment.content);
  
  if (wordCount <= 5) return 'Very Short';
  if (wordCount <= 15) return 'Short';
  if (wordCount <= 50) return 'Medium';
  return 'Long';
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get domain from URL
 */
export function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * Escape regex special characters
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate a random string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
