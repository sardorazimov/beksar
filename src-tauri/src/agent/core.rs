use crate::agent::memory::Memory;

pub struct Agent {
    pub memory: Memory,
}

impl Agent {
    pub fn new() -> Self {
        Self {
            memory: Memory::new(),
        }
    }
}