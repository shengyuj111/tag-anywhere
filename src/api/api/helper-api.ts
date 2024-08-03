import apiSlice from "../api-slice";
import { DatabaseManager } from "../database/database-manager";
import { getCoverPath } from "./helper";
import { deleteFilesInFolder } from "./rust-api";

type SetupCommon = {
  indexPath: string;
  storehousePath: string;
};

export type StoreSetUpRequest = object & SetupCommon;
export type GetSetUpResponse = object & SetupCommon;
export type PathSetUp = object & SetupCommon;

export const helperApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    cleanUpUnusedFiles: builder.mutation<null, void>({
      queryFn: async () => {
        try {
          const db = await DatabaseManager.getInstance().getDbInstance();

          // Fetch all tags
          const tags: { coverPath: string | null }[] = await db.select(`
            SELECT coverPath
            FROM Tag
          `);

          // Fetch all fileData
          const fileData: { coverPath: string | null }[] = await db.select(`
            SELECT id, name, path, rsa, description, type, coverPath
            FROM FileData
          `);

          // Collect all cover paths from tags and fileData
          const coverPaths = [
            ...tags.map((tag) => tag.coverPath).filter(Boolean),
            ...fileData.map((file) => file.coverPath).filter(Boolean),
          ] as string[];

          // Define the folder path (adjust as needed)
          const folderPath = await getCoverPath();

          // Call deleteFilesInFolder
          await deleteFilesInFolder(folderPath, coverPaths);

          return { data: null };
        } catch (error: unknown) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error:
                (error as Error).message || "Failed to clean up unused files",
            },
          };
        }
      },
      invalidatesTags: [],
    }),
  }),
});

export const { useCleanUpUnusedFilesMutation } = helperApi;
