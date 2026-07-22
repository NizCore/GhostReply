import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  UserSettings, 
  AIConfig,
  Tone,
  Length,
  Language,
  Theme,
  DEFAULT_SETTINGS,
  TONE_OPTIONS,
  LENGTH_OPTIONS,
  LANGUAGE_OPTIONS,
  THEME_OPTIONS,
  MODEL_OPTIONS
} from '@types';
import { useSettings, useTheme } from '@hooks/useStorage';
import { useAI } from '@hooks/useAI';
import { Button, Spinner } from '@components/Button';
import { Input, Textarea } from '@components/Input';
import { CustomSelect } from '@components/Select';
import { 
  Save, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
  Key,
  Bot,
  Thermometer,
  Type,
  Globe,
  Palette,
  Sparkles
} from 'lucide-react';

// Import CSS
import './options.css';

/**
 * Options Page Component
 */
function OptionsPage() {
  const [settings, saveSettings] = useSettings();
  const [, setTheme] = useTheme();
  const [, , , testConnection, getModels] = useAI();

  // State
  const [aiConfig, setAiConfig] = useState<AIConfig>(settings.aiConfig || DEFAULT_SETTINGS.aiConfig);
  const [defaultTone, setDefaultTone] = useState<Tone>(settings.defaultTone || 'friendly');
  const [defaultLength, setDefaultLength] = useState<Length>(settings.defaultLength || 'medium');
  const [defaultLanguage, setDefaultLanguage] = useState<Language>(settings.defaultLanguage || 'auto');
  const [theme, setThemeState] = useState<Theme>(settings.theme || 'system');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Load models on mount
  useEffect(() => {
    if (aiConfig.apiKey && aiConfig.baseUrl) {
      loadModels();
    }
  }, [aiConfig.apiKey, aiConfig.baseUrl]);

  // Load models
  const loadModels = useCallback(async () => {
    if (!aiConfig.apiKey || !aiConfig.baseUrl) return;

    setIsLoadingModels(true);
    setModelError(null);

    try {
      const models = await getModels();
      setAvailableModels(models);
    } catch (error) {
      setModelError('Failed to load models. Please check your API configuration.');
    } finally {
      setIsLoadingModels(false);
    }
  }, [aiConfig.apiKey, aiConfig.baseUrl, getModels]);

  // Test connection
  const handleTestConnection = useCallback(async () => {
    if (!aiConfig.apiKey || !aiConfig.baseUrl) {
      setConnectionStatus({ success: false, message: 'Please enter API key and base URL' });
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      const success = await testConnection();
      if (success) {
        setConnectionStatus({ success: true, message: 'Connection successful!' });
        await loadModels();
      } else {
        setConnectionStatus({ success: false, message: 'Connection failed. Please check your credentials.' });
      }
    } catch (error) {
      setConnectionStatus({ success: false, message: 'Connection failed. Please check your credentials.' });
    } finally {
      setIsTestingConnection(false);
    }
  }, [aiConfig.apiKey, aiConfig.baseUrl, testConnection, loadModels]);

  // Save settings
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const newSettings: UserSettings = {
        aiConfig,
        defaultTone,
        defaultLength,
        defaultLanguage,
        theme,
      };

      await saveSettings(newSettings);
      setTheme(theme);
      setSaveStatus({ success: true, message: 'Settings saved successfully!' });
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus({ success: false, message: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }, [aiConfig, defaultTone, defaultLength, defaultLanguage, theme, saveSettings, setTheme]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setAiConfig(DEFAULT_SETTINGS.aiConfig);
    setDefaultTone(DEFAULT_SETTINGS.defaultTone);
    setDefaultLength(DEFAULT_SETTINGS.defaultLength);
    setDefaultLanguage(DEFAULT_SETTINGS.defaultLanguage);
    setThemeState(DEFAULT_SETTINGS.theme);
    setAvailableModels([]);
    setConnectionStatus(null);
    setModelError(null);
  }, []);

  // Update AI config
  const handleAiConfigChange = useCallback((field: keyof AIConfig, value: string | number) => {
    setAiConfig(prev => ({
      ...prev,
      [field]: value,
    }));
    setConnectionStatus(null);
    setAvailableModels([]);
  }, []);

  // Get model options including available models
  const modelOptions = MODEL_OPTIONS.map(opt => ({
    ...opt,
    disabled: availableModels.length > 0 && !availableModels.includes(opt.value),
  }));

  // Check if current model is available
  const isCurrentModelAvailable = availableModels.length === 0 || 
    availableModels.includes(aiConfig.model);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <div className="options-header">
        <div className="options-header-content">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">GR</span>
            </div>
            <div>
              <h1 className="options-title">GhostReply Settings</h1>
              <p className="text-sm text-text-secondary">Configure your AI and preferences</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={handleReset}
              disabled={isSaving}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button 
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="options-main">
        {/* Save Status */}
        {saveStatus && (
          <div className={`mb-6 p-4 rounded-lg ${saveStatus.success ? 'success-box' : 'error-state'}`}>
            <div className="flex items-center gap-2">
              {saveStatus.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>{saveStatus.message}</span>
            </div>
          </div>
        )}

        {/* AI Configuration Section */}
        <section className="options-section">
          <div className="options-section-header">
            <h2 className="options-section-title">
              <Bot className="w-5 h-5 mr-2 inline" />
              AI Configuration
            </h2>
            <p className="options-section-description">
              Configure your OpenAI compatible API
            </p>
          </div>

          <div className="settings-card">
            <div className="settings-card-header">
              <h3 className="settings-card-title">API Settings</h3>
              <p className="settings-card-description">
                Enter your API credentials and endpoint
              </p>
            </div>

            <div className="api-config space-y-4">
              <div className="api-config-item">
                <label className="api-config-label">
                  <Key className="w-4 h-4 mr-2 inline" />
                  API Key
                </label>
                <Input
                  type="password"
                  value={aiConfig.apiKey}
                  onChange={(e) => handleAiConfigChange('apiKey', e.target.value)}
                  placeholder="Enter your API key"
                  className="api-config-input"
                  hint="Your API key will be stored securely in Chrome's sync storage"
                />
              </div>

              <div className="api-config-item">
                <label className="api-config-label">
                  <Globe className="w-4 h-4 mr-2 inline" />
                  Base URL
                </label>
                <Input
                  type="url"
                  value={aiConfig.baseUrl}
                  onChange={(e) => handleAiConfigChange('baseUrl', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="api-config-input"
                  hint="The base URL for your OpenAI compatible API"
                />
              </div>

              <div className="api-config-item">
                <label className="api-config-label">
                  <Bot className="w-4 h-4 mr-2 inline" />
                  Model
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <CustomSelect
                      options={modelOptions}
                      value={aiConfig.model}
                      onChange={(value) => handleAiConfigChange('model', value)}
                      disabled={isLoadingModels}
                      placeholder="Select a model"
                      hint={isCurrentModelAvailable ? '' : 'This model may not be available with your current API'}
                    />
                  </div>
                  <Button
                    onClick={loadModels}
                    isLoading={isLoadingModels}
                    disabled={!aiConfig.apiKey || !aiConfig.baseUrl}
                    title="Refresh models"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                {modelError && (
                  <p className="text-xs text-red-500 mt-1">{modelError}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="api-config-item">
                  <label className="api-config-label">
                    <Thermometer className="w-4 h-4 mr-2 inline" />
                    Temperature
                  </label>
                  <Input
                    type="number"
                    value={aiConfig.temperature}
                    onChange={(e) => handleAiConfigChange('temperature', parseFloat(e.target.value) || 0)}
                    min={0}
                    max={2}
                    step={0.1}
                    className="api-config-input"
                    hint="Controls randomness (0-2)"
                  />
                </div>

                <div className="api-config-item">
                  <label className="api-config-label">
                    <Type className="w-4 h-4 mr-2 inline" />
                    Max Tokens
                  </label>
                  <Input
                    type="number"
                    value={aiConfig.maxTokens}
                    onChange={(e) => handleAiConfigChange('maxTokens', parseInt(e.target.value) || 0)}
                    min={1}
                    max={4096}
                    step={1}
                    className="api-config-input"
                    hint="Maximum tokens to generate"
                  />
                </div>
              </div>

              <div className="api-config-item">
                <Button 
                  onClick={handleTestConnection}
                  isLoading={isTestingConnection}
                  disabled={!aiConfig.apiKey || !aiConfig.baseUrl}
                  variant="primary"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
                
                {connectionStatus && (
                  <div className={`connection-status mt-2 flex items-center gap-2 ${
                    connectionStatus.success ? 'connection-status-success' : 'connection-status-error'
                  }`}>
                    {connectionStatus.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>{connectionStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="divider">
          <span className="divider-text">Default Settings</span>
        </div>

        {/* Default Settings Section */}
        <section className="options-section">
          <div className="options-section-header">
            <h2 className="options-section-title">
              <Sparkles className="w-5 h-5 mr-2 inline" />
              Default Settings
            </h2>
            <p className="options-section-description">
              Set your preferred defaults for comment generation
            </p>
          </div>

          <div className="settings-card">
            <div className="default-settings-grid">
              <div className="default-settings">
                <h4 className="text-sm font-medium text-text-primary mb-3">Tone</h4>
                <CustomSelect
                  options={TONE_OPTIONS}
                  value={defaultTone}
                  onChange={(value) => setDefaultTone(value as Tone)}
                  placeholder="Select default tone"
                />
              </div>

              <div className="default-settings">
                <h4 className="text-sm font-medium text-text-primary mb-3">Length</h4>
                <CustomSelect
                  options={LENGTH_OPTIONS}
                  value={defaultLength}
                  onChange={(value) => setDefaultLength(value as Length)}
                  placeholder="Select default length"
                />
              </div>

              <div className="default-settings">
                <h4 className="text-sm font-medium text-text-primary mb-3">Language</h4>
                <CustomSelect
                  options={LANGUAGE_OPTIONS}
                  value={defaultLanguage}
                  onChange={(value) => setDefaultLanguage(value as Language)}
                  placeholder="Select default language"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="divider">
          <span className="divider-text">Appearance</span>
        </div>

        {/* Theme Settings Section */}
        <section className="options-section">
          <div className="options-section-header">
            <h2 className="options-section-title">
              <Palette className="w-5 h-5 mr-2 inline" />
              Theme Settings
            </h2>
            <p className="options-section-description">
              Choose your preferred color scheme
            </p>
          </div>

          <div className="settings-card">
            <div className="theme-settings">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {THEME_OPTIONS.map((option) => {
                  const isSelected = theme === option.value;
                  
                  return (
                    <label
                      key={option.value}
                      className={`theme-option cursor-pointer ${
                        isSelected ? 'theme-option-selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => setThemeState(option.value as Theme)}
                        className="theme-option-radio"
                      />
                      <div className="theme-option-icon">
                        {option.value === 'light' && <Sun className="w-6 h-6" />}
                        {option.value === 'dark' && <Moon className="w-6 h-6" />}
                        {option.value === 'system' && <Monitor className="w-6 h-6" />}
                      </div>
                      <div className="theme-option-label">
                        <div className="theme-option-title">{option.label}</div>
                        <div className="theme-option-description">
                          {option.value === 'light' && 'Light mode'}
                          {option.value === 'dark' && 'Dark mode'}
                          {option.value === 'system' && 'Match system preference'}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="options-section">
          <div className="info-box">
            <h3 className="info-box-title">
              <AlertTriangle className="w-5 h-5 mr-2 inline" />
              Important Notes
            </h3>
            <div className="info-box-content">
              <ul className="custom-list">
                <li className="custom-list-item">
                  <div className="custom-list-icon">
                    <Key className="w-4 h-4" />
                  </div>
                  <div className="custom-list-content">
                    <div className="custom-list-title">API Key Security</div>
                    <div className="custom-list-description">
                      Your API key is stored securely in Chrome's sync storage and never transmitted anywhere else.
                    </div>
                  </div>
                </li>
                <li className="custom-list-item">
                  <div className="custom-list-icon">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="custom-list-content">
                    <div className="custom-list-title">OpenAI Compatible APIs</div>
                    <div className="custom-list-description">
                      GhostReply works with any OpenAI compatible API endpoint.
                    </div>
                  </div>
                </li>
                <li className="custom-list-item">
                  <div className="custom-list-icon">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="custom-list-content">
                    <div className="custom-list-title">Model Support</div>
                    <div className="custom-list-description">
                      Most OpenAI compatible models are supported. Some models may require different parameters.
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Supported Models */}
        <section className="options-section">
          <div className="options-section-header">
            <h2 className="options-section-title">Supported Models</h2>
            <p className="options-section-description">
              These models are pre-configured and should work with most OpenAI compatible APIs
            </p>
          </div>

          <div className="badge-list">
            {MODEL_OPTIONS.map((model) => (
              <span key={model.value} className="badge-list-item">
                {model.label}
              </span>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="options-actions">
          <div className="options-actions-right">
            <Button 
              variant="secondary" 
              onClick={handleReset}
              disabled={isSaving}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button 
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving}
              size="lg"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-border-color text-center">
        <p className="text-sm text-text-secondary">
          GhostReply v1.0.0 | AI-Powered Comment Generator
        </p>
      </footer>
    </div>
  );
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<OptionsPage />);
}

export default OptionsPage;
