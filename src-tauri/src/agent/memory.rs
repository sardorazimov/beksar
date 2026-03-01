#[derive(Clone)]
pub struct Message {
    pub role: String,
    pub content: String,
}

pub struct Memory {
    pub history: Vec<Message>,
}

impl Memory {
    pub fn new() -> Self {
        Self { history: Vec::new() }
    }

    pub fn add(&mut self, role: &str, content: &str) {
        self.history.push(Message {
            role: role.to_string(),
            content: content.to_string(),
        });
    }

    pub fn as_openai_format(&self) -> Vec<serde_json::Value> {
        self.history
            .iter()
            .map(|m| {
                serde_json::json!({
                    "role": m.role,
                    "content": m.content
                })
            })
            .collect()
    }
}