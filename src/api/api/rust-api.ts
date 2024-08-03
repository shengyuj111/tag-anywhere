import { invoke } from "@tauri-apps/api/tauri";

export type FileAndTypeInfo = {
  path: string;
  name: string;
  file_type: string;
};

export type fileHashResult = {
  path: string;
  hash: string;
};

export type fileStatsResult = {
  size: number;
  mime_type: string;
  created: number;
  dimensions: [number, number] | null;
  duration: number | null;
  frame_rate: number | null;
};

export const getFileStats = async (
  filePath: string,
): Promise<fileStatsResult> => {
  const result: fileStatsResult = await invoke("get_file_stats", { filePath });
  return result;
};

export const getVideoFrameRate = async (filePath: string): Promise<number> => {
  const result: number = await invoke("get_video_frame_rate", { filePath });
  return result;
};

export const getFilesAndTypes = async (
  dirPath: string,
): Promise<FileAndTypeInfo[]> => {
  const results: FileAndTypeInfo[] = await invoke("fetch_files_with_types", {
    dir: dirPath,
  });
  return results;
};

export const getFilesAndTypesWithPaths = async (
  paths: string[],
): Promise<FileAndTypeInfo[]> => {
  const results: FileAndTypeInfo[] = await invoke(
    "fetch_files_with_types_from_paths",
    {
      paths,
    },
  );
  return results;
};

export const hashFile = async (filePath: string): Promise<fileHashResult> => {
  const result: fileHashResult = await invoke("hash_file", { filePath });
  return result;
};

export const hashFilesInDirectory = async (
  dirPath: string,
  skipPaths: string[],
): Promise<fileHashResult[]> => {
  const results: fileHashResult[] = await invoke("hash_files_in_directory", {
    dirPath,
    skipPaths,
  });
  return results;
};

export const createThumbnail = async (
  coverName: string,
  filePath: string,
  indexDir: string,
  frameNumber: number | null,
  time: number | null,
): Promise<string> => {
  const results: string = await invoke("create_thumbnail_for_file", {
    coverName,
    filePath,
    indexDir,
    frameNumber,
    time,
  });
  return results;
};

export const deleteFilesInFolder = async (
  folderPath: string,
  inputPaths: string[],
): Promise<void> => {
  await invoke("delete_all_unlisted_files", { inputPaths, folderPath });
};

export const copyFileToDir = async (
  filePath: string,
  directoryPath: string,
): Promise<string> => {
  const destPath: string = await invoke("copy_file_to_dir", {
    filePath,
    directoryPath,
  });
  return destPath;
};
