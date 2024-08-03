use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use crate::error::AppError;

fn generate_unique_filename(destination: &Path, file_name: &str) -> PathBuf {
    let mut unique_file_name = file_name.to_string();
    let mut counter = 1;
    while destination.join(&unique_file_name).exists() {
        unique_file_name = format!("{}_{}", counter, file_name);
        counter += 1;
    }
    destination.join(unique_file_name)
}

pub fn copy_file_to_directory(file_path: String, directory_path: String) -> Result<String, AppError> {
    let file_name = Path::new(&file_path)
        .file_name()
        .ok_or("Invalid file path")?
        .to_str()
        .ok_or("Invalid file name")?;
    let destination = Path::new(&directory_path);

    let unique_destination = generate_unique_filename(destination, file_name);

    fs::copy(&file_path, &unique_destination)?;
    Ok(unique_destination.to_str().ok_or("Failed to convert path to string")?.to_string())
}

pub fn delete_unlisted_files(input_paths: Vec<String>, folder_path: String) -> Result<(), AppError> {
    // Convert input paths to a HashSet for efficient lookup
    let input_paths_set: HashSet<_> = input_paths.into_iter().collect();

    // Ensure the folder path is a directory
    let folder = Path::new(&folder_path);
    if !folder.is_dir() {
        return Err(AppError::new("Provided folder path is not a directory"));
    }

    // Read the directory
    let entries = fs::read_dir(folder).map_err(|e| AppError::new(&e.to_string()))?;

    // Iterate over the files in the directory
    for entry in entries {
        match entry {
            Ok(entry) => {
                let path = entry.path();
                let path_str = path.to_string_lossy().to_string();

                // Check if the file is not in the input paths
                if !input_paths_set.contains(&path_str) {
                    // Delete the file
                    fs::remove_file(&path).map_err(|e| AppError::new(&e.to_string()))?;
                }
            }
            Err(e) => return Err(AppError::new(&e.to_string())),
        }
    }

    Ok(())
}

