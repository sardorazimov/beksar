#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod openai_stream;

use tauri::Emitter;

#[tauri::command]
async fn stream_prompt(window: tauri::Window, prompt: String) -> Result<(), String> {
    println!("STREAM PROMPT CALLED");
    let api_key = std::env
        ::var("OPENAI_API_KEY")
        .map_err(|_| "Missing OPENAI_API_KEY".to_string())?;

    let tokens = openai_stream::stream_openai(&api_key, &prompt, window.clone()).await?;

    window.emit("token_usage", tokens).unwrap();

    Ok(())
}

fn main() {
    tauri::Builder
        ::default()
        .invoke_handler(tauri::generate_handler![stream_prompt])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
