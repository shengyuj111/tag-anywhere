use std::io;
use serde::Serialize;
use thiserror::Error;
use std::fmt;

#[derive(Debug, Serialize, Error)]
pub struct AppError {
    pub message: String,
}

impl AppError {
    pub fn new(message: &str) -> Self {
        AppError {
            message: message.to_string(),
        }
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl From<io::Error> for AppError {
    fn from(error: io::Error) -> Self {
        AppError::new(&error.to_string())
    }
}

impl From<&str> for AppError {
    fn from(error: &str) -> Self {
        AppError::new(error)
    }
}

impl From<String> for AppError {
    fn from(error: String) -> Self {
        AppError::new(&error)
    }
}
