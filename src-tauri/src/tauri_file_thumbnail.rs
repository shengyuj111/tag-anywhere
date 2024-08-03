use std::{
    fs::{self},
    process::Command
};
use mime_guess::{mime, MimeGuess};
use crate::error::AppError;

fn extract_frame_with_ffmpeg(ffmpeg_path: &str, file_path: &str, frame_number: usize, temp_frame_path: &str) -> Result<(), AppError> {
    let ffmpeg_output = Command::new(ffmpeg_path)
        .args(&[
            "-i", file_path,
            "-vf", &format!("select=gte(n\\,{})", frame_number),
            "-vsync", "vfr",
            "-frames:v", "1",
            temp_frame_path
        ])
        .output()
        .map_err(|e| AppError::new(&e.to_string()))?;

    if !ffmpeg_output.status.success() {
        return Err(AppError::new(&format!(
            "Failed to extract the frame using FFmpeg:\nstdout: {:?}\nstderr: {:?}",
            String::from_utf8_lossy(&ffmpeg_output.stdout),
            String::from_utf8_lossy(&ffmpeg_output.stderr)
        )));
    }

    Ok(())
}

fn extract_frame_with_ffmpeg_by_time(ffmpeg_path: &str, file_path: &str, time: f64, temp_frame_path: &str) -> Result<(), AppError> {
    let ffmpeg_output = Command::new(ffmpeg_path)
        .args(&[
            "-i", file_path,
            "-ss", &time.to_string(),
            "-vframes", "1",
            temp_frame_path
        ])
        .output()
        .map_err(|e| AppError::new(&e.to_string()))?;

    if !ffmpeg_output.status.success() {
        return Err(AppError::new(&format!(
            "Failed to extract the frame using FFmpeg:\nstdout: {:?}\nstderr: {:?}",
            String::from_utf8_lossy(&ffmpeg_output.stdout),
            String::from_utf8_lossy(&ffmpeg_output.stderr)
        )));
    }

    Ok(())
}

fn compress_image_with_imagemagick(imagemagick_path: &str, input_path: &str, output_path: &str) -> Result<(), AppError> {
    let magick_output = Command::new(imagemagick_path)
        .args(&[
            input_path,
            "-resize", "500x",
            "-quality", "75",
            output_path
        ])
        .output()
        .map_err(|e| AppError::new(&e.to_string()))?;

    println!("ImageMagick: {:?}", magick_output);

    if !magick_output.status.success() {
        return Err(AppError::new(&format!(
            "Failed to compress the image using ImageMagick:\nstdout: {:?}\nstderr: {:?}",
            String::from_utf8_lossy(&magick_output.stdout),
            String::from_utf8_lossy(&magick_output.stderr)
        )));
    }

    Ok(())
}

fn handle_video(file_path: &str, temp_frame_path: &str, frame_number: Option<usize>) -> Result<Option<String>, AppError> {
    let ffmpeg_path = "bin/ffmpeg/ffmpeg-win.exe";
    let frame_to_extract = frame_number.unwrap_or(0);
    extract_frame_with_ffmpeg(ffmpeg_path, file_path, frame_to_extract, temp_frame_path)?;
    Ok(Some(temp_frame_path.to_string()))
}

fn handle_video_by_time(file_path: &str, temp_frame_path: &str, time: f64) -> Result<Option<String>, AppError> {
    let ffmpeg_path = "bin/ffmpeg/ffmpeg-win.exe";
    extract_frame_with_ffmpeg_by_time(ffmpeg_path, file_path, time, temp_frame_path)?;
    Ok(Some(temp_frame_path.to_string()))
}

fn handle_image(file_path: &str, output_path: &str) -> Result<(), AppError> {
    let imagemagick_path = "bin/magick/magick.exe";
    compress_image_with_imagemagick(imagemagick_path, file_path, output_path)
}

pub fn create_thumbnail(
    cover_name: String,
    file_path: String,
    index_dir: String,
    frame_number: Option<usize>,
    time: Option<f64>
) -> Result<Option<String>, AppError> {
    let temp_frame_path = format!("{}\\{}.png", index_dir, cover_name);
    let thumbnail_path = format!("{}\\{}.jpg", index_dir, cover_name);

    // Delete Existing Cover File
    if fs::metadata(&thumbnail_path).is_ok() {
        fs::remove_file(&thumbnail_path).map_err(|e| AppError::new(&e.to_string()))?;
    }

    // Determine MIME Type and Create Thumbnail
    let mime_type = MimeGuess::from_path(&file_path).first_or_octet_stream();

    if mime_type.type_() == mime::VIDEO {
        if let Some(time) = time {
            handle_video_by_time(&file_path, &temp_frame_path, time)?;
        } else {
            handle_video(&file_path, &temp_frame_path, frame_number)?;
        }
        compress_image_with_imagemagick("bin/magick/magick.exe", &temp_frame_path, &thumbnail_path)?;
    } else if mime_type.type_() == mime::IMAGE {
        handle_image(&file_path, &thumbnail_path)?;
    } else {
        return Ok(None);
    }

    if fs::metadata(&temp_frame_path).is_ok() {
        fs::remove_file(&temp_frame_path).map_err(|e| AppError::new(&e.to_string()))?;
    }

    Ok(Some(thumbnail_path))
}
