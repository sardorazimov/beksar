# Beksar.AI — Rust / Tauri Backend

This directory contains the Tauri v2 backend for Beksar.AI, written in Rust.

---

## Architecture

```
src-tauri/src/
├── main.rs            Binary entry point — calls beksar_lib::run()
├── lib.rs             Library root: declares modules, registers Tauri commands
├── openai_stream.rs   OpenAI chat completions SSE streaming
├── gemini.rs          Google Gemini SSE streaming
├── anthropic.rs       Anthropic Claude SSE streaming
├── agent/
│   ├── mod.rs         Module declarations
│   ├── core.rs        Agent struct (wraps Memory)
│   ├── memory.rs      Conversation history (Vec<Message>)
│   ├── openai.rs      Agent-level OpenAI streaming helper
│   └── tts.rs         Text-to-speech via OpenAI TTS API
├── providers/
│   ├── mod.rs         LLMProvider async trait
│   └── openai.rs      OpenAIProvider implementing the trait
└── tools/
    ├── mod.rs          Tool trait definition
    └── file_read.rs    FileRead tool (reads local files)
```

---

## Tauri Commands

### `stream_prompt`

```rust
#[tauri::command]
async fn stream_prompt(
    window: WebviewWindow,
    prompt: String,
    api_key: String,
    provider: String,   // "openai" | "anthropic" | "gemini"
) -> Result<(), String>
```

Dispatches the user prompt to the correct AI provider and streams the response back to the frontend via Tauri events.

**Emitted events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `stream_chunk` | `String` (token) | Each token as it arrives from the SSE stream |
| `stream_end` | `()` | Signals that the stream is complete |

---

## Provider Implementations

All three providers implement proper SSE (Server-Sent Events) parsing:

1. **`openai_stream.rs`** — Connects to `https://api.openai.com/v1/chat/completions` with `"stream": true`. Parses `data: {...}` lines and extracts `choices[0].delta.content`.

2. **`gemini.rs`** — Connects to Gemini's `streamGenerateContent` endpoint with `alt=sse`. Extracts `candidates[0].content.parts[0].text` from each event.

3. **`anthropic.rs`** — Connects to `https://api.anthropic.com/v1/messages` with `"stream": true`. Listens for `content_block_delta` events and extracts `delta.text`.

---

## Dependencies

| Crate | Purpose |
|-------|---------|
| `tauri` v2 | Desktop app framework |
| `tauri-plugin-opener` | Opening URLs/files |
| `reqwest` v0.12 | Async HTTP client with streaming |
| `tokio` | Async runtime |
| `futures-util` | `StreamExt` for byte stream iteration |
| `serde` / `serde_json` | JSON serialization |
| `async-trait` | Async trait support |
| `base64` | Base64 encoding for TTS audio |

---

## Building

```bash
# Development (with hot-reload frontend)
npm run tauri dev

# Production build
npm run tauri build
```

Output bundles are in `target/release/bundle/`.

---

## Entry Point Convention (Tauri v2)

- `main.rs` — thin binary entry: `fn main() { beksar_lib::run(); }`
- `lib.rs` — all app logic, module declarations, and command registration via `tauri::generate_handler!`

This separation allows the same library code to be used for both the desktop binary and mobile targets.
