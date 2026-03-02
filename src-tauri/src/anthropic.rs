use tauri::{Emitter, WebviewWindow};
use serde_json::json;
use futures_util::StreamExt;

pub async fn stream_claude(api_key: &str, prompt: &str, window: WebviewWindow) -> Result<(), String> {
    let client = reqwest::Client::new();
    
    let response = client.post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&json!({
            "model": "claude-3-5-sonnet-20240620",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
            "stream": true
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let mut stream = response.bytes_stream();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&chunk);
        
        // Claude chunk ayıklama ve emit
        if text.contains("text_delta") {
             window.emit("stream_chunk", text.to_string()).map_err(|e| e.to_string())?;
        }
    }

    window.emit("stream_end", ()).map_err(|e| e.to_string())?;
    Ok(())
}