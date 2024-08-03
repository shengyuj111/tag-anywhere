use std::fs::File;
use std::io::{BufReader, Read};
use std::path::PathBuf;
use ring::digest::{Context, SHA256};
use data_encoding::HEXLOWER;
use serde::Serialize;
use crate::error::AppError;

#[derive(Debug, Serialize)]
pub struct FileHashResult {
    pub path: String,
    pub hash: String,
}

pub fn read_and_hash_file(file: &PathBuf) -> Result<String, AppError> {
    let md = std::fs::metadata(&file)?;
    if md.is_file() {
        let f = File::open(&file)?;
        let mut buffer = [0; 1024];
        let mut reader = BufReader::new(f);
        let mut hasher = Context::new(&SHA256);

        loop {
            let len = reader.read(&mut buffer)?;
            if len == 0 {
                break;
            }

            hasher.update(&buffer[..len]);
        }

        let hash = hasher.finish();
        Ok(HEXLOWER.encode(hash.as_ref()))
    } else {
        Err(AppError::from("Not a file"))
    }
}

pub async fn read_single_file_and_hash(file_path: String) -> Result<FileHashResult, AppError> {
    let path = PathBuf::from(&file_path);

    match read_and_hash_file(&path) {
        Ok(hash) => Ok(FileHashResult {
            path: file_path.clone(),
            hash,
        }),
        Err(e) => Err(e),
    }
}

pub async fn read_files_and_hash(
  dir_path: String,
  skip_paths: Vec<String>,
) -> Result<Vec<FileHashResult>, AppError> {
    let mut results = Vec::new();
    let skip_set: std::collections::HashSet<String> = skip_paths.into_iter().collect();

    let dir_entries = std::fs::read_dir(&dir_path)?;

    for entry in dir_entries {
        let entry = entry?;
        let path = entry.path();
        let path_str = path.to_str().ok_or_else(|| AppError::from("Invalid path string"))?.to_string();

        if skip_set.contains(&path_str) {
            continue;
        }

        if path.is_file() {
            match read_and_hash_file(&path) {
                Ok(hash) => results.push(FileHashResult {
                    path: path_str,
                    hash,
                }),
                Err(e) => return Err(e),
            }
        }
    }

    Ok(results)
}
