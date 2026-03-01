#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod agent;
mod tools;



use agent::core::Agent;
use std::sync::Mutex;

use tauri::{State, Window, Emitter};
use dotenv::dotenv;

use futures_util::StreamExt;
use reqwest::Client;
use serde_json::json;
use std::env;

struct AppState {
    agent: Mutex<Agent>,
}

fn system_prompt() -> String {
    r#"
You are BEKSAR, a developer AI assistant.

If you need to read a file, respond ONLY with valid JSON in this format:

{
  "tool_call": {
    "name": "read_file",
    "input": "relative/or/absolute/path"
  }
}

Do not include explanations when calling a tool.
Only output pure JSON.

If no tool is required, respond normally in natural language.
"#.to_string()
}

async fn call_openai_stream(
    messages: Vec<serde_json::Value>,
    window: &Window,
) -> Result<String, String> {

    let api_key = env::var("OPENAI_API_KEY")
        .map_err(|_| "API key missing".to_string())?;

    let client = Client::new();

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&json!({
            "model": "gpt-4o-mini",
            "stream": true,
            "messages": messages
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut assistant_reply = String::new();

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
                    return Ok(assistant_reply);
                }

                if let Ok(json) =
                    serde_json::from_str::<serde_json::Value>(data)
                {
                    if let Some(content) =
                        json["choices"][0]["delta"]["content"].as_str()
                    {
                        assistant_reply.push_str(content);
                        window.emit("stream_chunk", content).unwrap();
                    }
                }
            }
        }
    }

    Ok(assistant_reply)
}

#[tauri::command]
async fn stream_prompt(
    prompt: String,
    window: Window,
    state: State<'_, AppState>,
) -> Result<(), String> {

    // 1️⃣ USER MEMORY
    {
        let mut agent = state.agent.lock().unwrap();
        agent.memory.add("user", &prompt);
    }

    // 2️⃣ BUILD MESSAGE LIST
    let messages = {
        let agent = state.agent.lock().unwrap();

        let mut msgs = vec![json!({
            "role": "system",
            "content": system_prompt()
        })];

        msgs.extend(agent.memory.as_openai_format());
        msgs
    };

    // 3️⃣ STREAM CALL
    let assistant_reply = call_openai_stream(messages, &window).await?;

    // 4️⃣ TOOL DETECT (SAFE JSON PARSE)
    if let Ok(parsed) =
        serde_json::from_str::<serde_json::Value>(&assistant_reply)
    {
        if let Some(tool_call) = parsed.get("tool_call") {
            window.emit("tool_request", tool_call).unwrap();
            return Ok(());
        }
    }

    // 5️⃣ NORMAL MEMORY SAVE
    {
        let mut agent = state.agent.lock().unwrap();
        agent.memory.add("assistant", &assistant_reply);
    }

    Ok(())
}

#[tauri::command]
async fn approve_tool(
    name: String,
    input: String,
    window: Window,
    state: State<'_, AppState>,
) -> Result<(), String> {

    // 1️⃣ EXECUTE TOOL
    let result = match name.as_str() {
        "read_file" => {
            crate::tools::file_read::FileRead::execute(&input)?
        }
        _ => return Err("Unknown tool".into())
    };

    // 2️⃣ SAVE TOOL RESULT
    {
        let mut agent = state.agent.lock().unwrap();
        agent.memory.add("tool", &result);
    }

    // 3️⃣ SECOND LLM CALL WITH TOOL RESULT
    let messages = {
        let agent = state.agent.lock().unwrap();

        let mut msgs = vec![json!({
            "role": "system",
            "content": system_prompt()
        })];

        msgs.extend(agent.memory.as_openai_format());
        msgs
    };

    call_openai_stream(messages, &window).await?;

    Ok(())
}

fn main() {
    dotenv().ok();

    tauri::Builder::default()
        .manage(AppState {
            agent: Mutex::new(Agent::new()),
        })
        .invoke_handler(tauri::generate_handler![
            stream_prompt,
            approve_tool
        ])
        .run(tauri::generate_context!())
        .expect("error while running BEKSAR");
}