import apiSlice from "../api-slice";
import { DatabaseManager } from "../database/database-manager";
import { getCoverPath } from "./helper";
import { deleteFilesInFolder } from "./rust-api";

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
            SELECT coverPath
            FROM FileData
          `);

          // Fetch all library
          const library: { coverPath: string | null }[] = await db.select(`
            SELECT coverPath
            FROM Library
          `);

          // Collect all cover paths from tags and fileData
          const coverPaths = [
            ...tags.map((tag) => tag.coverPath).filter(Boolean),
            ...fileData.map((file) => file.coverPath).filter(Boolean),
            ...library.map((lib) => lib.coverPath).filter(Boolean),
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
