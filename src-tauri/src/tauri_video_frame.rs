use std::process::Command;
use crate::error::AppError;
use std::os::windows::process::CommandExt;
const CREATE_NO_WINDOW: u32 = 0x08000000;


pub fn get_frame_rate(file_path: &String) -> Result<f64, AppError> {
    let ffprobe_path = "bin/ffmpeg/ffprobe-win.exe";
    let ffprobe_output = Command::new(ffprobe_path)
        .args(&[
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=r_frame_rate",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file_path,
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| AppError::new(&e.to_string()))?;

    if !ffprobe_output.status.success() {
        return Err(AppError::new(&format!(
            "Failed to get frame rate using FFprobe:\nstdout: {}\nstderr: {}",
            String::from_utf8_lossy(&ffprobe_output.stdout),
            String::from_utf8_lossy(&ffprobe_output.stderr)
        )));
    }

    let output = String::from_utf8_lossy(&ffprobe_output.stdout);
    let frame_rate_str = output.trim();

    if frame_rate_str.is_empty() {
        return Ok(-1.0);
    }

    let parts: Vec<&str> = frame_rate_str.split('/').collect();
    if parts.len() == 2 {
        let numerator = parts[0].parse::<f64>().map_err(|e| AppError::new(&e.to_string()))?;
        let denominator = parts[1].parse::<f64>().map_err(|e| AppError::new(&e.to_string()))?;
        return Ok(numerator / denominator);
    }

    Ok(-1.0)
}