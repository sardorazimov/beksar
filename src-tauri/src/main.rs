mod openai_stream;
mod gemini;
mod anthropic;

use tauri::WebviewWindow;

// SADECE BURADA #[tauri::command] kalsın! 
// Başka hiçbir dosyada (gemini.rs, lib.rs vb.) bu etiket OLMAMALI.
#[tauri::command]
pub async fn stream_prompt(
    window: WebviewWindow,
    prompt: String,
    api_key: String,
    provider: String,
) -> Result<(), String> {
    match provider.as_str() {
        "openai" => openai_stream::stream_openai(&api_key, &prompt, window).await,
        "gemini" => gemini::stream_gemini(&api_key, &prompt, window).await,
        "anthropic" => anthropic::stream_claude(&api_key, &prompt, window).await,
        _ => Err("Geçersiz sağlayıcı!".to_string()),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init()) // Senin lib.rs'den gelen eklenti
        .invoke_handler(tauri::generate_handler![stream_prompt])
        .run(tauri::generate_context!())
        .expect("Beksar başlatılırken bir hata oluştu!");
}