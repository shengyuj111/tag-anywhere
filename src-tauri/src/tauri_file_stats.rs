use std::fs;
use std::process::Command;
use mime_guess::MimeGuess;
use serde::Serialize;
use std::time::{UNIX_EPOCH, SystemTime};
use regex::Regex;
use std::os::windows::process::CommandExt;
const CREATE_NO_WINDOW: u32 = 0x08000000;

use crate::error::AppError;

#[derive(Serialize)]
pub struct FileStats {
    size: u64,
    mime_type: String,
    created: u64,
    dimensions: Option<(u32, u32)>,
    duration: Option<f64>,
    frame_rate: Option<f64>,
}

pub fn get_stats(path: String) -> Result<FileStats, AppError> {
    let metadata = fs::metadata(&path).map_err(AppError::from)?;
    let file_size = metadata.len();
    let mime_type = MimeGuess::from_path(&path).first_or_octet_stream().to_string();
    let created = metadata
        .created()
        .unwrap_or(SystemTime::now())
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let dimensions;
    let duration;
    let frame_rate;

    if mime_type.starts_with("image/") {
        dimensions = get_image_dimensions(&path);
        duration = None;
        frame_rate = None;
    } else if mime_type.starts_with("video/") {
        let video_metadata = get_video_metadata(&path)?;
        dimensions = video_metadata.dimensions;
        duration = video_metadata.duration;
        frame_rate = video_metadata.frame_rate;
    } else if mime_type.starts_with("audio/") {
        let audio_metadata = get_audio_metadata(&path)?;
        dimensions = None;
        duration = audio_metadata.duration;
        frame_rate = None;
    } else {
        return Err(AppError::new("Unsupported file type"));
    }
    Ok(FileStats {
        size: file_size,
        mime_type,
        created,
        dimensions,
        duration,
        frame_rate,
    })
}

fn get_image_dimensions(path: &str) -> Option<(u32, u32)> {
    let imagemagick_path = "bin/magick/magick.exe";
    let output = Command::new(imagemagick_path)
        .args(&["identify", "-format", "%wx%h", path])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok()?;
    let output_str = String::from_utf8_lossy(&output.stdout);

    let dimension_re = Regex::new(r"(\d+)x(\d+)").ok()?;
    if let Some(caps) = dimension_re.captures(&output_str) {
        let width = caps[1].parse::<u32>().ok()?;
        let height = caps[2].parse::<u32>().ok()?;
        return Some((width, height));
    }
    None
}

#[derive(Debug)]
struct VideoMetadata {
    dimensions: Option<(u32, u32)>,
    duration: Option<f64>,
    frame_rate: Option<f64>,
}

fn get_video_metadata(path: &str) -> Result<VideoMetadata, AppError> {
    let ffmpeg_path = "bin/ffmpeg/ffmpeg-win.exe";
    let output = Command::new(ffmpeg_path)
        .args(&["-i", path])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(AppError::from)?;
    let output_str = String::from_utf8_lossy(&output.stderr);

    let duration = parse_duration(&output_str)?;
    let frame_rate = parse_frame_rate(&output_str)?;
    let dimensions = parse_dimensions(&output_str)?;

    Ok(VideoMetadata {
        dimensions,
        duration,
        frame_rate,
    })
}

fn parse_duration(output: &str) -> Result<Option<f64>, AppError> {
    let duration_re = Regex::new(r"Duration: (\d+):(\d+):(\d+\.\d+)").map_err(|e| AppError::new(&e.to_string()))?;
    if let Some(caps) = duration_re.captures(output) {
        let hours: f64 = caps[1].parse::<f64>().map_err(|e| AppError::new(&e.to_string()))?;
        let minutes = caps[2].parse::<f64>().map_err(|e| AppError::new(&e.to_string()))?;
        let seconds = caps[3].parse::<f64>().map_err(|e| AppError::new(&e.to_string()))?;
        return Ok(Some(hours * 3600.0 + minutes * 60.0 + seconds));
    }
    Ok(None)
}

fn parse_frame_rate(output: &str) -> Result<Option<f64>, AppError> {
    let frame_rate_re = Regex::new(r"(\d+(?:\.\d+)?) fps").map_err(|e| AppError::new(&e.to_string()))?;
    if let Some(caps) = frame_rate_re.captures(output) {
        let frame_rate = caps[1].parse::<f64>().map_err(|e| AppError::new(&e.to_string()))?;
        return Ok(Some(frame_rate));
    }
    Ok(None)
}

fn parse_dimensions(output: &str) -> Result<Option<(u32, u32)>, AppError> {
    let dimension_re = Regex::new(r"(\d+)x(\d+) \[SAR").map_err(|e| AppError::new(&e.to_string()))?;
    if let Some(caps) = dimension_re.captures(output) {
        let width = caps[1].parse::<u32>().map_err(|e| AppError::new(&e.to_string()))?;
        let height = caps[2].parse::<u32>().map_err(|e| AppError::new(&e.to_string()))?;
        return Ok(Some((width, height)));
    }
    Ok(None)
}

#[derive(Debug)]
struct AudioMetadata {
    duration: Option<f64>,
}

fn get_audio_metadata(path: &str) -> Result<AudioMetadata, AppError> {
    let ffmpeg_path = "bin/ffmpeg/ffmpeg-win.exe";
    let output = Command::new(ffmpeg_path)
        .args(&["-i", path])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(AppError::from)?;
    let output_str = String::from_utf8_lossy(&output.stderr);

    let duration = parse_duration(&output_str)?;

    Ok(AudioMetadata {
        duration,
    })
}
