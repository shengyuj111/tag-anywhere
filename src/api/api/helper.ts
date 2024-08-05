import { Store } from "tauri-plugin-store-api";
import { StoreSetUpRequest } from "./setup-api";
import Database from "tauri-plugin-sql-api";
import { v4 as uuidv4 } from "uuid";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { getFilesAndTypes } from "./rust-api";
import { formatFileName } from "@/lib/format-utils";

export const getStorePathConfig = async () => {
  const store = new Store(".settings.dat");
  const setup = await store.get<StoreSetUpRequest>("setup");
  if (!setup) {
    throw new Error("Setup not found");
  }
  return setup;
};

export const getCoverPathBySetUp = (setup: StoreSetUpRequest) => {
  return `${setup.indexPath}\\cover`;
};

export const getStorePathBySetUp = (setup: StoreSetUpRequest) => {
  return setup.storehousePath;
};

export const getCoverPath = async () => {
  const setup = await getStorePathConfig();
  return getCoverPathBySetUp(setup);
};

export const getStorePath = async () => {
  const setup = await getStorePathConfig();
  return getStorePathBySetUp(setup);
};

export const getCoverAndStoreSetUp = async () => {
  const setup = await getStorePathConfig();
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
  console.log("existingFileNames", existingFileNames);
  return getUniqueNameNotInList(existingFileNames);
}

export const getUniqueNamesInFolder = async (dirPath: string, count: number) => {
  const existingFileNames = await getFileNamesInFolder(dirPath);
  const uniqueNames: string[] = [];
  for (let i = 0; i < count; i++) {
    const uniqueName = await getUniqueNameNotInList(existingFileNames);
    uniqueNames.push(uniqueName);
    existingFileNames.push(uniqueName);
  }
  return uniqueNames;
}

export const getFileNamesInFolder = async (dirPath: string) => {
  const filesInfo = await getFilesAndTypes(dirPath);
  return filesInfo.map((file) => formatFileName(file.name)!);
}

export const getUniqueNameNotInList = async (existingNames: string[]) => {
  let uniqueName = "";
  while (existingNames.includes(uniqueName)) {
    uniqueName = `${uuidv4()}`;
  }
  return uniqueName;
}