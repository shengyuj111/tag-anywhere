// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use app::{error::AppError, tauri_file_hash::{read_files_and_hash, read_single_file_and_hash, FileHashResult}, tauri_file_operation::{copy_file_to_directory, delete_unlisted_files}, tauri_file_scan::{get_files_with_types, get_files_with_types_from_paths, FileInfo}, tauri_file_stats::{get_stats, FileStats}, tauri_file_thumbnail::create_thumbnail, tauri_video_frame::get_frame_rate};
use tauri::command;

#[command]
async fn hash_file(file_path: String) -> Result<FileHashResult, AppError> {
    read_single_file_and_hash(file_path).await
}

#[command]
async fn hash_files_in_directory(dir_path: String, skip_paths: Vec<String>) -> Result<Vec<FileHashResult>, AppError> {
    read_files_and_hash(dir_path, skip_paths).await
}

#[command]
fn fetch_files_with_types(dir: String) -> Result<Vec<FileInfo>, AppError> {
    get_files_with_types(&dir)
}

#[command]
fn create_thumbnail_for_file(cover_name: String, file_path: String, index_dir: String, frame_number: Option<usize>, time: Option<f64>) -> Result<Option<String>, AppError> {
    create_thumbnail(cover_name, file_path, index_dir, frame_number, time)
}

#[command]
fn copy_file_to_dir(file_path: String, directory_path: String) -> Result<String, AppError> {
    copy_file_to_directory(file_path, directory_path)
}

#[command]
fn fetch_files_with_types_from_paths(paths: Vec<String>) -> Result<Vec<FileInfo>, AppError> {
    get_files_with_types_from_paths(paths)
}

#[command]
fn get_video_frame_rate(file_path: String) -> Result<f64, AppError> {
    get_frame_rate(&file_path)
}

#[command]
fn get_file_stats(file_path: String) -> Result<FileStats, AppError> {
    return get_stats(file_path);
}

#[command]
fn delete_all_unlisted_files(input_paths: Vec<String>, folder_path: String) -> Result<(), AppError> {
    delete_unlisted_files(input_paths, folder_path)
}

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .invoke_handler(tauri::generate_handler![
        hash_file, 
        hash_files_in_directory, 
        fetch_files_with_types, 
        create_thumbnail_for_file, 
        copy_file_to_dir,
        fetch_files_with_types_from_paths, 
        get_video_frame_rate, 
        get_file_stats, 
        delete_all_unlisted_files
        ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
