use crate::providers::LLMProvider;
use async_trait::async_trait;
use reqwest::Client;
use futures_util::StreamExt;

pub struct OpenAIProvider {
    pub api_key: String,
}

#[async_trait]
impl LLMProvider for OpenAIProvider {
    async fn stream(
        &self,
        messages: Vec<serde_json::Value>,
        window: tauri::Window,
    ) -> Result<String, String> {

        let client = Client::new();

        let response = client
            .post("https://api.openai.com/v1/chat/completions")
            .bearer_auth(&self.api_key)
            .json(&serde_json::json!({
                "model": "gpt-4o-mini",
                "stream": true,
                "messages": messages
            }))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let mut stream = response.bytes_stream();
        let mut buffer = String::new();
        let mut final_text = String::new();

        while let Some(item) = stream.next().await {
            let chunk = item.map_err(|e| e.to_string())?;
            let chunk_str = String::from_utf8_lossy(&chunk);
            buffer.push_str(&chunk_str);

            while let Some(pos) = buffer.find('\n') {
                let line = buffer[..pos].trim().to_string();
                buffer = buffer[pos + 1..].to_string();

                if line.starts_with("data: ") {
                    let data = line.trim_start_matches("data: ").trim();

                    if data == "[DONE]" {
                        window.emit("stream_end", "done").unwrap();
                        return Ok(final_text);
                    }

                    if let Ok(json) =
                        serde_json::from_str::<serde_json::Value>(data)
                    {
                        if let Some(content) =
                            json["choices"][0]["delta"]["content"].as_str()
                        {
                            final_text.push_str(content);
                            window.emit("stream_chunk", content).unwrap();
                        }
                    }
                }
            }
        }

        Ok(final_text)
    }
}