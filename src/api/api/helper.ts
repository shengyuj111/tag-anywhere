import Database from "tauri-plugin-sql-api";
import { v4 as uuidv4 } from "uuid";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { getFilesAndTypes } from "./rust-api";
import { formatFileName } from "@/lib/format-utils";
import { getSettings, GlobalSettings } from "./settings-api";

export const getCoverPathBySetUp = (settings: GlobalSettings) => {
  return `${settings.indexPath}\\cover`;
};

export const getStorePathBySetUp = (settings: GlobalSettings) => {
  return settings.storehousePath!;
};

export const getCoverPath = async () => {
  const setup = await getSettings();
  return getCoverPathBySetUp(setup);
};

export const getStorePath = async () => {
  const setup = await getSettings();
  return getStorePathBySetUp(setup);
};

export const getCoverAndStoreSetUp = async () => {
  const setup = await getSettings();
  return {
    coverPath: getCoverPathBySetUp(setup),
    storehousePaths: getStorePathBySetUp(setup),
  };
};

export const isFileCoverNameUnique = async (
  db: Database,
  coverName: string,
  cover_dir_path: string,
) => {
  const fullCoverPath = `${cover_dir_path}/${coverName}.png`;
  const checkExisting: unknown[] = await db.select(
    `
    SELECT 1
    FROM FileData
    WHERE coverPath = ?
    `,
    [fullCoverPath],
  );
  return checkExisting.length === 0;
};

export const getExistingFilePaths = async (db: Database) => {
  const existingFiles: { path: string }[] = await db.select(
    `
    SELECT path
    FROM FileData
    `,
    [],
  );
  return existingFiles.map((file) => file.path);
};

export const pathToUrl = (
  path: string | undefined | null,
): string | undefined => {
  if (!path) return undefined;
  return convertFileSrc(path);
};

export const replacePathWithIndex = (
  path: string,
  folderPaths: string[],
): string => {
  for (let i = 0; i < folderPaths.length; i++) {
    if (path.startsWith(folderPaths[i])) {
      return path.replace(folderPaths[i], `[[${i}]]`);
    }
  }
  return path;
};

export const getUniqueNameInFolder = async (dirPath: string) => {
  const existingFileNames = await getFileNamesInFolder(dirPath);
  return getUniqueNameNotInList(existingFileNames);
};

export const getUniqueNamesInFolder = async (
  dirPath: string,
  count: number,
) => {
  const existingFileNames = await getFileNamesInFolder(dirPath);
  const uniqueNames: string[] = [];
  for (let i = 0; i < count; i++) {
    const uniqueName = await getUniqueNameNotInList(existingFileNames);
    uniqueNames.push(uniqueName);
    existingFileNames.push(uniqueName);
  }
  return uniqueNames;
};

export const getFileNamesInFolder = async (dirPath: string) => {
  const filesInfo = await getFilesAndTypes(dirPath);
  return filesInfo.map((file) => formatFileName(file.name)!);
};

export const getUniqueNameNotInList = async (existingNames: string[]) => {
  let uniqueName = `${uuidv4()}`;
  while (existingNames.includes(uniqueName)) {
    uniqueName = `${uuidv4()}`;
  }
  return uniqueName;
};
