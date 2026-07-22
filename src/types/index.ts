// Platform types
export type Platform = 'youtube' | 'linkedin' | 'x' | 'twitter' | 'reddit' | 'unknown';

// Tone types
export type Tone = 
  | 'professional'
  | 'friendly'
  | 'casual'
  | 'funny'
  | 'insightful'
  | 'supportive'
  | 'formal'
  | 'curious'
  | 'critical';

// Length types
export type Length = 'very_short' | 'short' | 'medium' | 'long';

// Language types
export type Language = 
  | 'auto'
  | 'english'
  | 'bangla'
  | 'spanish'
  | 'french'
  | 'german'
  | 'japanese'
  | 'chinese'
  | 'arabic';

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// AI Settings
export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

// User Settings
export interface UserSettings {
  defaultTone: Tone;
  defaultLength: Length;
  defaultLanguage: Language;
  theme: Theme;
  aiConfig: AIConfig;
}

// Context extraction
export interface ExtractedContext {
  platform: Platform;
  url: string;
  title: string;
  description: string;
  author: string;
  postContent: string;
  selectedText: string;
  visibleText: string;
}

// Comment generation
export interface GenerationOptions {
  tone: Tone;
  length: Length;
  language: Language;
  count: number;
}

// Generated comment
export interface GeneratedComment {
  id: string;
  content: string;
  tone: Tone;
  length: Length;
  language: Language;
  timestamp: number;
  platform: Platform;
}

// History item
export interface HistoryItem {
  id: string;
  comments: GeneratedComment[];
  context: Partial<ExtractedContext>;
  timestamp: number;
}

// Favorite comment
export interface FavoriteComment extends GeneratedComment {
  savedAt: number;
}

// Message types for communication
export type MessageType = 
  | 'EXTRACT_CONTEXT'
  | 'EXTRACT_CONTEXT_RESPONSE'
  | 'GENERATE_COMMENT'
  | 'GENERATE_COMMENT_RESPONSE'
  | 'GENERATE_COMMENT_ERROR'
  | 'INSERT_COMMENT'
  | 'INSERT_COMMENT_RESPONSE'
  | 'GET_SETTINGS'
  | 'GET_SETTINGS_RESPONSE'
  | 'SAVE_SETTINGS'
  | 'SAVE_SETTINGS_RESPONSE'
  | 'GET_HISTORY'
  | 'GET_HISTORY_RESPONSE'
  | 'SAVE_HISTORY'
  | 'SAVE_HISTORY_RESPONSE'
  | 'GET_FAVORITES'
  | 'GET_FAVORITES_RESPONSE'
  | 'SAVE_FAVORITE'
  | 'SAVE_FAVORITE_RESPONSE'
  | 'REMOVE_FAVORITE'
  | 'REMOVE_FAVORITE_RESPONSE'
  | 'OPEN_SIDE_PANEL'
  | 'CLOSE_SIDE_PANEL';

// Message interface
export interface ExtensionMessage {
  type: MessageType;
  data?: any;
  error?: string;
  requestId?: string;
}

// Storage keys
export enum StorageKeys {
  SETTINGS = 'ghostreply_settings',
  HISTORY = 'ghostreply_history',
  FAVORITES = 'ghostreply_favorites',
}

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  defaultTone: 'friendly',
  defaultLength: 'medium',
  defaultLanguage: 'auto',
  theme: 'system',
  aiConfig: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 500,
  },
};

// Tone options
export const TONE_OPTIONS: { value: Tone; label: string; emoji: string }[] = [
  { value: 'professional', label: 'Professional', emoji: '💼' },
  { value: 'friendly', label: 'Friendly', emoji: '😊' },
  { value: 'casual', label: 'Casual', emoji: '😎' },
  { value: 'funny', label: 'Funny', emoji: '😂' },
  { value: 'insightful', label: 'Insightful', emoji: '💡' },
  { value: 'supportive', label: 'Supportive', emoji: '❤️' },
  { value: 'formal', label: 'Formal', emoji: '📝' },
  { value: 'curious', label: 'Curious', emoji: '❓' },
  { value: 'critical', label: 'Critical', emoji: '🔍' },
];

// Length options
export const LENGTH_OPTIONS: { value: Length; label: string; emoji: string }[] = [
  { value: 'very_short', label: 'Very Short', emoji: '⚡' },
  { value: 'short', label: 'Short', emoji: '📌' },
  { value: 'medium', label: 'Medium', emoji: '📄' },
  { value: 'long', label: 'Long', emoji: '📜' },
];

// Language options
export const LANGUAGE_OPTIONS: { value: Language; label: string; emoji: string }[] = [
  { value: 'auto', label: 'Auto Detect', emoji: '🌍' },
  { value: 'english', label: 'English', emoji: '🇬🇧' },
  { value: 'bangla', label: 'Bangla', emoji: '🇧🇩' },
  { value: 'spanish', label: 'Spanish', emoji: '🇪🇸' },
  { value: 'french', label: 'French', emoji: '🇫🇷' },
  { value: 'german', label: 'German', emoji: '🇩🇪' },
  { value: 'japanese', label: 'Japanese', emoji: '🇯🇵' },
  { value: 'chinese', label: 'Chinese', emoji: '🇨🇳' },
  { value: 'arabic', label: 'Arabic', emoji: '🇸🇦' },
];

// Platform options
export const PLATFORM_OPTIONS: { value: Platform; label: string; emoji: string; color: string }[] = [
  { value: 'youtube', label: 'YouTube', emoji: '📺', color: '#FF0000' },
  { value: 'linkedin', label: 'LinkedIn', emoji: '💼', color: '#0077B5' },
  { value: 'x', label: 'X (Twitter)', emoji: '🐦', color: '#000000' },
  { value: 'twitter', label: 'Twitter', emoji: '🐦', color: '#1DA1F2' },
  { value: 'reddit', label: 'Reddit', emoji: '🔴', color: '#FF4500' },
];

// Count options for number of comments to generate
export const COUNT_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1 Comment' },
  { value: 3, label: '3 Comments' },
  { value: 5, label: '5 Comments' },
];

// Theme options
export const THEME_OPTIONS: { value: Theme; label: string; emoji: string }[] = [
  { value: 'light', label: 'Light', emoji: '☀️' },
  { value: 'dark', label: 'Dark', emoji: '🌙' },
  { value: 'system', label: 'System', emoji: '💻' },
];

// AI Model options
export const MODEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'llama-3-8b', label: 'Llama 3 8B' },
  { value: 'llama-3-70b', label: 'Llama 3 70B' },
  { value: 'mistral-large', label: 'Mistral Large' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
];
