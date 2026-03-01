pub mod file_read;

pub trait Tool {
    fn name(&self) -> &str;
    fn execute(&self, input: &str) -> String;
}