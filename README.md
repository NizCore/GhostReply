# GhostReply

GhostReply 👻 is an AI-powered Chrome extension that helps you write thoughtful, engaging, and context-aware comments across YouTube, LinkedIn, X (Twitter), and Reddit. With a single click, it analyzes the conversation and generates natural replies that match your preferred tone, whether professional, friendly, insightful, humorous, or supportive.

## Features

### 🎯 Platform Support
- **YouTube** - Generate comments for videos
- **LinkedIn** - Professional comments for posts and articles
- **X (Twitter)** - Witty and concise replies
- **Reddit** - Engaging comments for threads

### ✨ AI-Powered Generation
- **Context-aware** - Analyzes page content, titles, descriptions, and more
- **Multiple tones** - Professional, Friendly, Casual, Funny, Insightful, Supportive, Formal, Curious, Critical
- **Customizable length** - Very Short, Short, Medium, Long
- **Language support** - Auto-detect, English, Bangla, Spanish, French, German, Japanese, Chinese, Arabic
- **Multiple variations** - Generate 1, 3, or 5 unique comments at once

### 💡 Smart Features
- **Automatic platform detection** - Knows which platform you're on
- **Selected text support** - Generate comments from highlighted text
- **Context menu integration** - Right-click to generate comments
- **Keyboard shortcut** - Ctrl+Shift+G to open GhostReply
- **Side panel** - Full-featured interface for extended use

### 📝 Comment Management
- **Copy to clipboard** - One-click copy
- **Auto-insert** - Insert directly into comment boxes
- **Regenerate** - Get different variations
- **History** - View past generations
- **Favorites** - Save your best comments

### 🎨 Customization
- **API Configuration** - Use any OpenAI-compatible API
- **Model selection** - Choose from various AI models
- **Temperature control** - Adjust creativity level
- **Token limits** - Control response length
- **Theme support** - Light, Dark, or System preference

## Installation

### Prerequisites
- Google Chrome (version 110 or later)
- Node.js (version 18 or later)
- npm or yarn

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NizCore/GhostReply.git
   cd GhostReply
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Build the extension:**
   ```bash
   npm run build
   # or
   yarn build
   ```

4. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the `dist` folder from your project

5. **Configure API:**
   - Click the GhostReply icon in your extensions bar
   - Go to Settings
   - Enter your OpenAI-compatible API key and base URL
   - Test the connection
   - Save settings

### Development Mode

To run in development mode with hot reloading:

```bash
npm run dev
# or
yarn dev
```

Then load the `dist` folder in Chrome as described above.

## Configuration

### API Settings

GhostReply supports any OpenAI-compatible API. Here are some popular options:

| Provider | Base URL | Notes |
|----------|----------|-------|
| OpenAI | `https://api.openai.com/v1` | Official OpenAI API |
| Anthropic | `https://api.anthropic.com/v1` | Claude models |
| Google | `https://generativelanguage.googleapis.com/v1beta` | Gemini models |
| Mistral | `https://api.mistral.ai/v1` | Mistral models |
| Local | `http://localhost:11434/v1` | Ollama, LM Studio, etc. |

### Recommended Models

- **GPT-4 Turbo** - Best quality, fast
- **GPT-3.5 Turbo** - Good balance of quality and cost
- **Claude 3 Sonnet** - Excellent for nuanced comments
- **Llama 3 70B** - Great open-source option
- **Mistral Large** - High-quality European model

### Model Parameters

- **Temperature**: Controls randomness (0-2)
  - Lower = more deterministic
  - Higher = more creative
  - Recommended: 0.7-1.0

- **Max Tokens**: Limits response length
  - Recommended: 500-1000 for comments

## Usage

### Basic Usage

1. Navigate to any supported platform (YouTube, LinkedIn, X, Reddit)
2. Click the GhostReply extension icon
3. Adjust tone, length, and language as desired
4. Click **Generate Comments**
5. Copy or insert your favorite comment

### Advanced Usage

- **Right-click text** → **GhostReply: Generate Comment** - Generate from selected text
- **Right-click text** → **GhostReply: Generate Reply** - Reply to selected comment
- **Ctrl+Shift+G** - Open GhostReply side panel
- **Side Panel** → Access history, favorites, and full generation options

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+G | Open GhostReply side panel |

### Context Menu

- **Generate Comment** - Generate comment from selected text
- **Generate Reply** - Generate reply to selected text
- **Open Side Panel** - Open the full GhostReply interface

## Project Structure

```
ghostreply/
├── src/
│   ├── background/          # Background service worker
│   │   └── background.ts
│   ├── content/             # Content scripts
│   │   └── content.ts
│   ├── popup/               # Browser action popup
│   │   ├── popup.html
│   │   ├── popup.tsx
│   │   └── popup.css
│   ├── sidepanel/           # Side panel interface
│   │   ├── sidepanel.html
│   │   ├── sidepanel.tsx
│   │   └── sidepanel.css
│   ├── options/             # Options page
│   │   ├── options.html
│   │   ├── options.tsx
│   │   └── options.css
│   ├── components/          # React components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── useStorage.ts
│   │   ├── useAI.ts
│   │   └── ...
│   ├── services/            # Business logic services
│   │   ├── aiService.ts
│   │   ├── contextExtractor.ts
│   │   ├── commentInserter.ts
│   │   └── promptBuilder.ts
│   ├── utils/               # Utility functions
│   │   ├── storage.ts
│   │   ├── helpers.ts
│   │   ├── messenger.ts
│   │   └── cn.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   └── assets/              # Static assets
│
├── public/                 # Public assets
│   └── icons/
│       └── icon.svg
├── manifest.json           # Chrome extension manifest
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Tech Stack

- **Chrome Extension Manifest V3** - Modern Chrome extension architecture
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library
- **Chrome Storage API** - Persistent storage
- **OpenAI Compatible API** - AI model integration

## Permissions

GhostReply requires the following permissions:

- `storage` - Save settings, history, and favorites
- `activeTab` - Access current tab for context extraction
- `scripting` - Inject content scripts
- `tabs` - Query and manage tabs
- `contextMenus` - Add right-click context menu items

Host permissions:
- `https://*.youtube.com/*`
- `https://*.linkedin.com/*`
- `https://*.x.com/*`
- `https://*.twitter.com/*`
- `https://*.reddit.com/*`

## Security

- ✅ API keys are stored securely in Chrome's sync storage
- ✅ All extracted content is sanitized to prevent XSS
- ✅ Follows Manifest V3 best practices
- ✅ All messages between components are validated
- ✅ No external tracking or analytics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Keep components small and focused
- Add appropriate types and interfaces
- Include JSDoc comments for complex functions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or feedback:

- Open an issue on [GitHub](https://github.com/NizCore/GhostReply)
- Check the [documentation](#) (coming soon)

## Roadmap

- [ ] Browser support (Firefox, Edge)
- [ ] More platform support (Facebook, Instagram, etc.)
- [ ] Custom prompt templates
- [ ] Comment scheduling
- [ ] Team collaboration features
- [ ] Cloud sync across devices
- [ ] Mobile companion app

---

**GhostReply** - Your AI comment companion for social media

*Made with ❤️ and AI*
