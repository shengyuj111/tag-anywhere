import { Store } from "tauri-plugin-store-api";
import { StoreSetUpRequest } from "./setup-api";
import Database from "tauri-plugin-sql-api";
import { convertFileSrc } from "@tauri-apps/api/tauri";

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
