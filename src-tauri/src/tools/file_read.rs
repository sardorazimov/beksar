use std::fs;

pub struct FileRead;

impl FileRead {
    pub fn execute(path: &str) -> Result<String, String> {
        fs::read_to_string(path)
            .map_err(|e| e.to_string())
    }
}