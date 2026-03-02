use tauri::{Emitter, WebviewWindow};
use serde_json::json;
use futures_util::StreamExt;

pub async fn stream_claude(api_key: &str, prompt: &str, window: WebviewWindow) -> Result<(), String> {
    let client = reqwest::Client::new();

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&json!({
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt}],
            "stream": true
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&chunk);
        buffer.push_str(&text);

        while let Some(pos) = buffer.find('\n') {
            let line = buffer[..pos].trim().to_string();
            buffer = buffer[pos + 1..].to_string();

            if line.starts_with("data: ") {
                let data = line.trim_start_matches("data: ").trim();
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if json["type"] == "content_block_delta" {
                        if let Some(text) = json["delta"]["text"].as_str() {
                            window.emit("stream_chunk", text).map_err(|e| e.to_string())?;
                        }
                    }
                }
            }
        }
    }

    window.emit("stream_end", ()).map_err(|e| e.to_string())?;
    Ok(())
}