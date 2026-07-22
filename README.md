# GhostReply

GhostReply is an AI-powered Chrome extension that helps you write thoughtful, engaging, and context-aware comments across YouTube, LinkedIn, X (Twitter), and Reddit. With a single click, it analyzes the conversation and generates natural replies from a **human commenter** perspective — matching your preferred tone, whether professional, friendly, insightful, humorous, or supportive.

## Owner

| | |
|---|---|
| **Owner** | Mohammad Nizam Uddin Imran |
| **Website** | [imrann.my.id](https://imrann.my.id) |

**Made with** ChatGPT, Mistral, and Cursor.

## Features

### Platform Support
- **YouTube** — Generate comments for videos
- **LinkedIn** — Professional comments for posts and articles
- **X (Twitter)** — Witty and concise replies
- **Reddit** — Engaging comments for threads

### AI-Powered Generation
- **Context-aware** — Analyzes page content, titles, descriptions, and more
- **Human commenter style** — Writes as a real person reacting to the post
- **Multiple tones** — Professional, Friendly, Casual, Funny, Insightful, Supportive, Formal, Curious, Critical
- **Customizable length** — Very Short, Short, Medium, Long
- **Language support** — Auto-detect, English, Bangla, Spanish, French, German, Japanese, Chinese, Arabic
- **Multiple variations** — Generate 1–5 unique comments at once

### Smart Features
- **Automatic platform detection**
- **Selected text support** — Generate from highlighted text
- **Context menu** — Right-click to generate comments or replies
- **Keyboard shortcut** — `Ctrl+Shift+G` to open GhostReply
- **Side panel** — Full-featured interface for extended use

### Comment Management
- Copy to clipboard
- Insert into comment boxes
- Regenerate variations
- History of past generations
- Favorites for your best comments

### Customization
- Any **OpenAI-compatible** API (including Bynara and others)
- Model selection (type any model id your provider supports)
- Temperature and max tokens
- Light / Dark / System theme

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
   ```

3. **Build the extension:**
   ```bash
   npm run build
   ```

4. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the `dist` folder

5. **Configure API:**
   - Open GhostReply → Settings (or Options)
   - Enter:
     - **Base URL** — e.g. `https://router.bynara.id/v1`
     - **API Key** — your provider key
     - **Model** — e.g. `agnes-2.0-flash`, `mistral-large`, `claude-opus-4.8-bynara`
   - Click **Test Connection**, then **Save Settings**

### Development Mode

```bash
npm run dev
```

Then load the `dist` folder in Chrome as above.

## Configuration

### API Settings

GhostReply works with any OpenAI-compatible chat completions API:

| Provider | Base URL | Notes |
|----------|----------|-------|
| Bynara / NaraRouter | `https://router.bynara.id/v1` | Default-friendly OpenAI-compatible router |
| OpenAI | `https://api.openai.com/v1` | Official OpenAI API |
| Mistral | `https://api.mistral.ai/v1` | Mistral models |
| Local | `http://localhost:11434/v1` | Ollama, LM Studio, etc. |

Use the `/v1` root only — not the full `/chat/completions` path.

### Model Parameters

- **Temperature** (0–2): lower = more focused, higher = more creative (try `0.7`–`1.0`)
- **Max Tokens**: response length budget (try `500`–`1000` for comments)

## Usage

1. Open a supported site (YouTube, LinkedIn, X, Reddit)
2. Click the GhostReply icon (or press `Ctrl+Shift+G`)
3. Choose tone, length, and language
4. Click **Generate Comments**
5. Copy or insert your favorite reply

### Shortcuts & context menu

| Action | How |
|--------|-----|
| Open side panel | `Ctrl+Shift+G` |
| Generate from selection | Right-click → **GhostReply: Generate Comment** |
| Reply to selection | Right-click → **GhostReply: Generate Reply** |

## Project Structure

```
GhostReply/
├── src/
│   ├── background/          # Service worker (messaging, AI, history)
│   ├── content/             # Page context + comment insertion
│   ├── popup/               # Extension popup UI
│   ├── sidepanel/           # Side panel UI
│   ├── options/             # Settings page
│   ├── components/          # Shared React components
│   ├── hooks/               # React hooks (storage, AI)
│   ├── services/            # AI, context, prompts, inserter
│   ├── utils/               # Storage, helpers, messaging
│   └── types/               # TypeScript types
├── public/                  # Static assets (icon)
├── dist/                    # Build output (load this in Chrome)
├── manifest.json
├── package.json
├── vite.config.ts
└── README.md
```

## Tech Stack

- Chrome Extension Manifest V3
- React 18 + TypeScript
- Vite + `@crxjs/vite-plugin`
- Tailwind CSS
- Lucide React
- Chrome Storage API (`local`)
- OpenAI-compatible Chat Completions API

## Permissions

- `storage` — settings, history, favorites
- `activeTab` / `tabs` — current page context
- `scripting` — content script helpers
- `contextMenus` — right-click actions

Supported sites (content scripts): YouTube, LinkedIn, X/Twitter, Reddit.  
Network access is used to call your configured AI endpoint.

## Security & Privacy

- API keys are stored in **Chrome local storage** on your device
- Page context is sent only to the AI endpoint you configure
- No analytics or third-party tracking built into the extension
- Comments are cleaned for display/copy (no HTML-entity mangling)

## Publishing (Chrome Web Store)

1. `npm run build`
2. Zip the contents of `dist/`
3. Create a listing at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Provide screenshots, privacy policy, and permission justifications
5. Submit for review

## Contributing

Contributions are welcome — open a Pull Request on [GitHub](https://github.com/NizCore/GhostReply).

1. Fork the repo
2. Create a feature branch
3. Commit and push
4. Open a PR

## License

MIT — see [LICENSE](LICENSE).

## Support

- Issues: [github.com/NizCore/GhostReply](https://github.com/NizCore/GhostReply)
- Owner site: [imrann.my.id](https://imrann.my.id)

## Roadmap

- [ ] Firefox / Edge support
- [ ] More platforms (Facebook, Instagram, etc.)
- [ ] Custom prompt templates
- [ ] Comment scheduling
- [ ] Team / collaboration features

---

**GhostReply** — AI comments that sound like a real commenter.

**Owner:** Mohammad Nizam Uddin Imran · [imrann.my.id](https://imrann.my.id)

*Made with ChatGPT, Mistral, and Cursor.*
