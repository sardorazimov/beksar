use tauri::{Emitter, WebviewWindow};
use serde_json::json;
use futures_util::StreamExt;

pub async fn stream_gemini(api_key: &str, prompt: &str, window: WebviewWindow) -> Result<(), String> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key={}",
        api_key
    );

    let client = reqwest::Client::new();
    let response = client.post(url)
        .json(&json!({
            "contents": [{ "parts": [{ "text": prompt }] }]
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let mut stream = response.bytes_stream();
    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&chunk).to_string();
        window.emit("stream_chunk", text).map_err(|e| e.to_string())?;
    }

    window.emit("stream_end", ()).map_err(|e| e.to_string())?;
    Ok(())
}