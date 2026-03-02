mod openai_stream;
mod gemini;
mod anthropic;

use tauri::WebviewWindow;

#[tauri::command]
async fn stream_prompt(
    window: WebviewWindow,
    prompt: String,
    api_key: String,
    provider: String,
) -> Result<(), String> {
    match provider.as_str() {
        "openai" => openai_stream::stream_openai(&api_key, &prompt, window).await,
        "gemini" => gemini::stream_gemini(&api_key, &prompt, window).await,
        "anthropic" => anthropic::stream_claude(&api_key, &prompt, window).await,
        _ => Err("Invalid provider".to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![stream_prompt])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
