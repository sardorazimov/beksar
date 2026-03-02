# BEKSAR — Desktop AI Developer Agent

<p align="center">
  <img src="src-tauri/icons/128x128.png" alt="BEKSAR Logo" width="80" />
</p>

<p align="center">
  A native desktop AI agent that lets you chat with <strong>GPT-4o-mini</strong>, stream responses in real time, and safely execute tools — all from a beautiful dark UI.
</p>



## ✨ Features

- **Conversational AI** — Chat with an OpenAI-powered developer agent that remembers the full conversation context.
- **Streaming responses** — Tokens are streamed to the UI as they are generated for an instant, responsive feel.
- **Tool approval system** — When the agent wants to execute a tool (e.g. read a file), a confirmation modal is shown so you stay in control.
- **File reading tool** — The agent can read files from your filesystem when you allow it.
- **Desktop-native** — Built with [Tauri](https://tauri.app/), so it ships as a lightweight native binary for Windows, macOS, and Linux.
- **Modern UI** — React + Tailwind CSS + Framer Motion with a dark neon aesthetic.

---

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| Backend | Rust (Tauri v2) |
| AI Provider | OpenAI API (`gpt-4o-mini`, streaming) |
| Build Tool | Vite |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain)
- [Tauri CLI prerequisites](https://tauri.app/start/prerequisites/) for your OS
- An **OpenAI API key**

### 1. Clone the repository

```bash
git clone https://github.com/sardorazimov/beksar.git
cd beksar
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure your API key

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-...your-key-here...
```

### 4. Run in development mode

```bash
npm run tauri dev
```

This starts the Vite dev server and the Tauri window simultaneously.

### 5. Build for production

```bash
npm run tauri build
```

The packaged installer is placed in `src-tauri/target/release/bundle/`.

---

## 🔧 How It Works

1. You type a message in the chat input.
2. The Rust backend appends it to the in-memory conversation history and calls the OpenAI API with streaming enabled.
3. Each token is emitted as a Tauri event (`stream_chunk`) and displayed in real time.
4. When the stream ends (`stream_end`), the message is committed to the chat history.
5. If the AI responds with a structured JSON `tool_call` (e.g. `read_file`), a **Tool Request** modal appears asking for your approval before the tool executes.
6. After tool execution the result is fed back to the AI for a follow-up response.

---

## 📁 Project Structure

```
beksar/
├── src/                   # React frontend
│   ├── App.tsx            # Main chat UI
│   └── pages/
│       └── Landing.tsx    # Landing page
├── src-tauri/             # Tauri / Rust backend
│   ├── src/
│   │   ├── main.rs        # Tauri commands & OpenAI streaming
│   │   ├── agent/         # Agent core & conversation memory
│   │   ├── providers/     # LLM provider abstraction (OpenAI)
│   │   └── tools/         # Tool implementations (file_read, …)
│   └── tauri.conf.json    # Tauri configuration
└── package.json
```

---

## 🛡️ Security

- Tool execution **always requires explicit user approval** via the confirmation dialog.
- Your API key is loaded from a local `.env` file and never leaves your machine except in requests to OpenAI.
- Do **not** commit your `.env` file — it is already listed in `.gitignore`.

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
