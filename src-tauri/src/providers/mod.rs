use async_trait::async_trait;
use tauri::WebviewWindow;

#[async_trait]
pub trait LLMProvider {
    async fn stream(
        &self,
        messages: Vec<serde_json::Value>,
        window: WebviewWindow,
    ) -> Result<String, String>;
}