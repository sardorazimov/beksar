use async_trait::async_trait;

#[async_trait]
pub trait LLMProvider {
    async fn stream(
        &self,
        messages: Vec<serde_json::Value>,
        window: tauri::Window,
    ) -> Result<String, String>;
}