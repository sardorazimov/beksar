use reqwest::Client;
use serde_json::Value;

pub async fn call_openai(
    api_key: &str,
    prompt: &str,
) -> Result<(String, u32), String> {

    let client = Client::new();

    let res = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&serde_json::json!({
            "model": "gpt-4o-mini",
            "messages": [
                { "role": "user", "content": prompt }
            ]
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: Value = res.json().await.map_err(|e| e.to_string())?;

    let content = json["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("")
        .to_string();

    let tokens = json["usage"]["total_tokens"]
        .as_u64()
        .unwrap_or(0) as u32;

    Ok((content, tokens))
}