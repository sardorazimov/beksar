use futures_util::StreamExt;
use reqwest::Client;
use serde_json::Value;
use tauri::Emitter;
pub async fn stream_openai(
    api_key: &str,
    prompt: &str,
    window: tauri::Window,
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
    let mut full_text = String::new();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&chunk);

        for line in text.split('\n') {
            if line.starts_with("data: ") {
                let data = line.trim_start_matches("data: ").trim();

                if data == "[DONE]" {
                    break;
                }

                if let Ok(json) = serde_json::from_str::<Value>(data) {
                    if let Some(content) = json["choices"][0]["delta"]["content"].as_str() {
                        full_text.push_str(content);
                        window.emit("stream_chunk", content).unwrap();
                    }
                }
            }
        }
    }

    window.emit("stream_end", ()).unwrap();

    // Basit token tahmini (gerçek usage stream'te gelmez)
    let estimated_tokens = (full_text.len() / 4) as u32;

    Ok(estimated_tokens)
}
