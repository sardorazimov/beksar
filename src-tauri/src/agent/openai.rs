use futures_util::StreamExt;
use reqwest::Client;
use serde_json::Value;
use tauri::{Emitter, WebviewWindow};

pub async fn stream_openai(
    api_key: &str,
    prompt: &str,
    window: WebviewWindow,
) -> Result<u32, String> {

    let client = Client::new();

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&serde_json::json!({
            "model": "gpt-4o-mini",
            "stream": true,
            "messages": [
                { "role": "user", "content": prompt }
            ]
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut full_text = String::new();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&chunk);

        buffer.push_str(&text);

        while let Some(pos) = buffer.find("\n\n") {
            let event = buffer[..pos].to_string();
            buffer = buffer[pos + 2..].to_string();

            if event.starts_with("data: ") {
                let data = event.trim_start_matches("data: ").trim();

                if data == "[DONE]" {
                    break;
                }

                if let Ok(json) = serde_json::from_str::<Value>(data) {
                    if let Some(content) =
                        json["choices"][0]["delta"]["content"].as_str()
                    {
                        full_text.push_str(content);
                        window.emit("stream_chunk", content).map_err(|e| e.to_string())?;
                    }
                }
            }
        }
    }

    window.emit("stream_end", ()).map_err(|e| e.to_string())?;

    let estimated_tokens = (full_text.len() / 4) as u32;

    Ok(estimated_tokens)
}