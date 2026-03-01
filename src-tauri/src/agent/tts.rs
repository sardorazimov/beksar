use reqwest::Client;

pub async fn text_to_speech(api_key: &str, text: &str) -> Result<String, String> {
    let client = Client::new();

    let res = client
        .post("https://api.openai.com/v1/audio/speech")
        .bearer_auth(api_key)
        .json(&serde_json::json!({
            "model": "gpt-4o-mini-tts",
            "voice": "alloy",
            "input": text
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let bytes = res.bytes().await.map_err(|e| e.to_string())?;

    Ok(base64::encode(bytes))
}