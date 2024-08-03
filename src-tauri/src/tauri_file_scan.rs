use mime_guess::from_path;
use mime_guess::mime;
use walkdir::WalkDir;
use serde::Serialize;
use std::path::PathBuf;
use crate::error::AppError;

#[derive(Debug, Serialize)]
pub enum FileType {
    Image,
    Video,
    Audio,
}

#[derive(Debug, Serialize)]
pub struct FileInfo {
    pub path: PathBuf,
    pub name: String,
    pub file_type: FileType,
}

fn categorize_mime_type(mime_type: &mime::Mime) -> Option<FileType> {
    match (mime_type.type_(), mime_type.subtype()) {
        (mime::IMAGE, _) => Some(FileType::Image),
        (mime::VIDEO, _) => Some(FileType::Video),
        (mime::AUDIO, _) => Some(FileType::Audio),
        _ => None,
    }
}

pub fn get_files_with_types(dir: &str) -> Result<Vec<FileInfo>, AppError> {
    let mut file_infos = Vec::new();

    for entry in WalkDir::new(dir).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_file() {
            let path = entry.path().to_path_buf();
            let name = entry.file_name().to_string_lossy().to_string();
            let mime_type = from_path(&path).first_or_octet_stream();
            if let Some(file_type) = categorize_mime_type(&mime_type) {
                file_infos.push(FileInfo {
                    path,
                    name,
                    file_type,
                });
            }
        }
    }

    Ok(file_infos)
}

pub fn get_files_with_types_from_paths(paths: Vec<String>) -> Result<Vec<FileInfo>, AppError> {
    let mut file_infos = Vec::new();

    for path_str in paths {
        let path = PathBuf::from(path_str);
        if path.is_file() {
            let name = path.file_name().unwrap().to_string_lossy().to_string();
            let mime_type = from_path(&path).first_or_octet_stream();
            if let Some(file_type) = categorize_mime_type(&mime_type) {
                file_infos.push(FileInfo {
                    path,
                    name,
                    file_type,
                });
            }
        }
    }

    Ok(file_infos)
}