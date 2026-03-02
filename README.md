<p align="center">
  <img src="src-tauri/icons/128x128.png" alt="Beksar.AI Logo" width="90" />
</p>

<h1 align="center">Beksar.AI — Desktop AI Agent</h1>

<p align="center">
  <strong>A powerful, privacy-first desktop AI agent with live screen reading, chess analysis, real-time streaming, and multi-provider support — built with Tauri + Rust + React.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.x-24C8D8?logo=tauri&logoColor=white" />
  <img src="https://img.shields.io/badge/Rust-stable-CE422B?logo=rust&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧠 **Multi-Provider AI** | Switch between OpenAI (GPT-4o-mini), Anthropic (Claude 3.5) and Google (Gemini 1.5 Flash) on the fly |
| ⚡ **Real-Time Streaming** | Tokens are streamed live from the AI to your screen via Tauri events — no waiting for the full response |
| 🖥️ **Live Screen Mode** | Activate live screen reading so the agent can observe what's on your display and narrate its activity in the toolbar |
| ♟️ **Chess Analysis Mode** | Watch a chess game while the agent analyzes the board live and suggests the best moves directly in the toolbar |
| ⏸️ **Pause & Resume** | Pause the live session at any moment, then resume without losing context |
| 🎙️ **Voice Control** | Toggle voice input mode — talk to the agent hands-free |
| 🛡️ **BYOK Privacy** | Bring Your Own Key — API keys are stored only in local storage, never transmitted to any backend |
| 🔐 **Firebase Auth** | Email/password registration and login powered by Firebase Authentication |
| 🌑 **Native Desktop** | Lightweight native binary for macOS, Windows and Linux via Tauri — no Electron, no Chromium bloat |

---

## 🖼️ App Structure

```
Landing Page (/) → Login (/login) → Agent (/agent)
```

- **Landing** — Hero page with features overview and quick-start CTAs
- **Login** — Firebase email/password auth (sign up or log in)
- **Agent** — Full-featured chat interface with live toolbar and activity feed

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5, Tailwind CSS v4, Framer Motion, Lucide Icons |
| Backend | Rust (Tauri v2), reqwest, tokio, futures-util |
| AI Providers | OpenAI API, Anthropic API, Google Gemini API |
| Auth | Firebase Authentication |
| Build Tool | Vite 7 |
| Packaging | Tauri bundler (macOS `.dmg`, Windows `.msi`, Linux `.AppImage`) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://www.rust-lang.org/tools/install) stable toolchain
- [Tauri v2 system dependencies](https://tauri.app/start/prerequisites/) for your OS
- An API key from at least one provider: [OpenAI](https://platform.openai.com/), [Anthropic](https://console.anthropic.com/), or [Google AI Studio](https://aistudio.google.com/)

### 1 — Clone

```bash
git clone https://github.com/sardorazimov/beksar.git
cd beksar
```

### 2 — Install frontend dependencies

```bash
npm install
```

### 3 — Run in development mode

```bash
npm run tauri dev
```

This starts the Vite dev server and opens the Tauri native window simultaneously.

### 4 — Enter your API key

Click the **Settings** (⚙️) button in the sidebar, select your AI provider, and paste your API key. Keys are stored in browser `localStorage` — they never leave your device.

### 5 — Build for production

```bash
npm run tauri build
```

The packaged installer is placed in `src-tauri/target/release/bundle/`.

---

## 🔧 How It Works

### Chat & Streaming

1. You type a message and press **Send** (or `Enter`).
2. The React frontend calls the Tauri `stream_prompt` command via `invoke()`.
3. The Rust backend sends the request to the selected AI provider with SSE streaming enabled.
4. Each token is parsed from the SSE stream and emitted as a `stream_chunk` Tauri event.
5. The frontend listens and appends each chunk to the streaming response in real time.
6. When the stream ends (`stream_end` event), the response is committed to the message history.

### Live Screen Mode

1. Click **Canlı Ekran** (Live Screen) in the toolbar.
2. The agent activates screen observation mode and logs its activity in the collapsible panel below the toolbar.
3. In **Chess Mode** (`♟ Satranç Modu`), the agent focuses on the chess board and displays real-time move suggestions in the toolbar badge.
4. Click **Beklet** (Pause) to freeze the agent without stopping the session; click **Devam Et** (Resume) to continue.
5. Click **Durdur** (Stop) to end the live session entirely.

---

## 📁 Project Structure

```
beksar/
├── src/                        # React frontend
│   ├── App.tsx                 # Router (Landing → Login → Agent)
│   ├── firebase.ts             # Firebase auth helpers
│   └── pages/
│       ├── Landing.tsx         # Welcome / features page
│       ├── Login.tsx           # Firebase auth form
│       └── Agent.tsx           # Main agent UI (chat + toolbar + live screen)
│
├── src-tauri/                  # Tauri / Rust backend
│   ├── src/
│   │   ├── main.rs             # Binary entry point → calls lib::run()
│   │   ├── lib.rs              # Tauri setup, command registration
│   │   ├── openai_stream.rs    # OpenAI SSE streaming implementation
│   │   ├── gemini.rs           # Google Gemini SSE streaming
│   │   ├── anthropic.rs        # Anthropic Claude SSE streaming
│   │   ├── agent/              # Agent core & conversation memory
│   │   ├── providers/          # LLM provider abstraction trait
│   │   └── tools/              # Tool implementations (file_read, …)
│   ├── Cargo.toml
│   └── tauri.conf.json         # Window size, bundle config
│
├── index.html
├── package.json
└── vite.config.ts
```

---

## 🛡️ Security & Privacy

- **BYOK (Bring Your Own Key)** — Your API keys are stored exclusively in the browser's `localStorage` on your local machine. They are sent directly from your device to the AI provider — Beksar never proxies them through any server.
- **No telemetry** — Beksar does not collect usage data, analytics, or any personal information.
- **Tool approval** — If future tool-use capabilities require file system access, a confirmation dialog appears before execution.
- **Do not commit your `.env` file** — it is listed in `.gitignore`.

---

## 🗺️ Roadmap

- [ ] Actual screen capture integration (Tauri screenshot plugin)
- [ ] Voice-to-text transcription (Whisper API)
- [ ] Conversation history persistence (SQLite via Tauri)
- [ ] Plugin system for custom tools
- [ ] Multi-window support

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

