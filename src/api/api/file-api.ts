import { DatabaseManager } from "../database/database-manager";
import apiSlice from "../api-slice";
import { createThumbnail, FileAndTypeInfo, getFilesAndTypes } from "./rust-api";
import {
  getCoverAndStoreSetUp,
  getExistingFilePaths,
  getUniqueNameInFolder,
  getUniqueNamesInFolder,
} from "./helper";
import { removeDuplicates } from "@/lib/collection-utils";
import { selectOne, selectOneOrNull } from "./database-helper";
import { exists, removeFile } from "@tauri-apps/api/fs";

export const fileTypes = [
  "Audio",
  "Video",
  "Image",
  "Child_Audio",
  "Child_Video",
  "Child_Image",
  "Composition_Manga",
  "Composition_TvSeries",
] as const;
export type FileType = (typeof fileTypes)[number];

export const fileTypeMap = {
  Audio: {
    defaultCoverPath: "audio_cover.png",
    label: "Audio",
    displayType: "Audio",
  },
  Video: {
    defaultCoverPath: "video_cover.png",
    label: "Video",
    displayType: "Video",
  },
  Image: {
    defaultCoverPath: "image_cover.png",
    label: "Image",
    displayType: "Image",
  },
  Child_Audio: {
    defaultCoverPath: "audio_cover.png",
    label: "Audio",
    displayType: "Audio",
  },
  Child_Video: {
    defaultCoverPath: "video_cover.png",
    label: "Video",
    displayType: "Video",
  },
  Child_Image: {
    defaultCoverPath: "image_cover.png",
    label: "Image",
    displayType: "Image",
  },
  Composition_Manga: {
    defaultCoverPath: "manga_cover.png",
    label: "Manga",
    displayType: "Manga",
  },
  Composition_TvSeries: {
    defaultCoverPath: "tv_series_cover.png",
    label: "Playlist",
    displayType: "TV Series",
  },
};

interface FileDetails {
  name: string;
  path: string | null;
  type: FileType;
  rsa: string | null;
  description: string;
  coverPath: string;
}

interface FileDetailsWithId extends FileDetails {
  id: number;
}

export const isFileComposition = (file: FileCommon): boolean => {
  return file.type.startsWith("Composition");
};

export const isFileChild = (file: FileCommon): boolean => {
  return file.type.startsWith("Child");
};

export const getFileDisplayType = (file: FileCommon): string => {
  return fileTypeMap[file.type].displayType;
};

export interface FileCommon extends FileDetailsWithId {
  tagIds: number[];
}

export interface GetFilesDatabaseResponse extends FileDetailsWithId {
  tagIds: string;
}

export type FileSortOnType = "id" | "name" | "numOfTags";

export interface GetFilesRequest {
  includeInName?: string;
  includeTagIds?: number[];
  excludeTagIds?: number[];
  includeFileIds?: number[];
  excludeFileIds?: number[];
  includeType?: FileType;
  pageSize?: number;
  page?: number;
  sortOn?: FileSortOnType;
  isAscending?: boolean;
  ignoreChildren?: boolean;
}

export interface GetFilesResponse {
  files: FileCommon[];
  totalPages: number;
}

export interface UpdateFileRequest extends Partial<FileDetails> {
  id: number;
}

export interface UpdateCoverRequest {
  time: number;
  id: number;
  videoFilePath: string;
}

export interface DeleteFileRequest {
  id: number;
}

export interface AddTagsToFileRequest {
  fileId: number;
  tagIds?: number[];
  tagNames?: string[];
}

export interface RemoveTagsFromFileRequest {
  fileId: number;
  tagIds?: number[];
}

export interface UpdateTagsRequest {
  fileIds: number[];
  tagIds?: number[];
}

export interface ScanFilesRequest {}

export interface ScanFilesResponse {
  results: FileCommon[];
  failedCount: number;
}

export interface CreateCompositeFileRequest {
  name: string;
  type: string;
  description: string;
  coverPath: string;
  childFilePaths: string[];
}

export interface GetFileByIdRequest {
  fileId: number;
}

export interface GetFileByIdResponse {
  file: FileCommon;
  fileChildren: FileCommon[];
}

export interface TagFileRequest {
  tagId: number;
  filePaths: string[];
}

export const fileApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllFiles: builder.query<GetFilesResponse, GetFilesRequest>({
      queryFn: async (request) => {
        try {
          const {
            includeInName,
            includeTagIds,
            excludeTagIds,
            includeFileIds,
            excludeFileIds,
            includeType,
            pageSize,
            page,
            ignoreChildren = true,
            sortOn = "id",
            isAscending = true,
          } = request;

          const db = await DatabaseManager.getInstance().getDbInstance();

          let baseQuery = `
            FROM FileData
          `;
          const conditions: string[] = [];
          const params: (string | number)[] = [];

          if (includeInName) {
            conditions.push("FileData.name LIKE ?");
            params.push(`%${includeInName}%`);
          }

          if (ignoreChildren) {
            conditions.push("FileData.type NOT LIKE 'Child_%'");
          }

          if (includeType) {
            if (includeType.startsWith("Composition")) {
              conditions.push("FileData.type = ?");
              params.push(includeType);
            } else {
              conditions.push("(FileData.type = ? OR FileData.type = ?)");
              params.push(includeType, `Child_${includeType}`);
            }
          }

          if (includeTagIds && includeTagIds.length > 0) {
            conditions.push(
              `FileData.id IN (
                SELECT file_id FROM FileTag
                JOIN Tag ON FileTag.tag_id = Tag.id
                WHERE Tag.id IN (${includeTagIds.map(() => "?").join(", ")})
              )`,
            );
            params.push(...includeTagIds);
          }

          if (excludeTagIds && excludeTagIds.length > 0) {
            conditions.push(
              `FileData.id NOT IN (
                SELECT file_id FROM FileTag
                JOIN Tag ON FileTag.tag_id = Tag.id
                WHERE Tag.id IN (${excludeTagIds.map(() => "?").join(", ")})
              )`,
            );
            params.push(...excludeTagIds);
          }

          if (includeFileIds && includeFileIds.length > 0) {
            conditions.push(
              `FileData.id IN (${includeFileIds.map(() => "?").join(", ")})`,
            );
            params.push(...includeFileIds);
          }

          if (excludeFileIds && excludeFileIds.length > 0) {
            conditions.push(
              `FileData.id NOT IN (${excludeFileIds.map(() => "?").join(", ")})`,
            );
            params.push(...excludeFileIds);
          }

          if (conditions.length > 0) {
            baseQuery += " WHERE " + conditions.join(" AND ");
          }

          // Query to count total files
          const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
          const countResult: { total: number }[] = await db.select(
            countQuery,
            params,
          );
          const totalFiles = countResult[0]?.total || 0;

          // Calculate total pages
          const totalPages = pageSize ? Math.ceil(totalFiles / pageSize) : 1;

          // Main query to fetch files
          let query = `
            SELECT FileData.*, COALESCE((
              SELECT GROUP_CONCAT(Tag.id)
              FROM Tag
              JOIN FileTag ON Tag.id = FileTag.tag_id
              WHERE FileTag.file_id = FileData.id
            ), '') as tagIds, 
            COALESCE((
              SELECT COUNT(Tag.id)
              FROM Tag
              JOIN FileTag ON Tag.id = FileTag.tag_id
              WHERE FileTag.file_id = FileData.id
            ), 0) as numOfTags
            ${baseQuery}
            GROUP BY FileData.id
          `;

          if (sortOn) {
            query += ` ORDER BY ${sortOn === "numOfTags" ? "numOfTags" : `FileData.${sortOn}`} ${isAscending ? "ASC" : "DESC"}`;
          }

          if (pageSize && page) {
            const offset = (page - 1) * pageSize;
            query += " LIMIT ? OFFSET ?";
            params.push(pageSize, offset);
          }

          const files: GetFilesDatabaseResponse[] = await db.select(
            query,
            params,
          );
          const result: FileCommon[] = files.map((file) => ({
            ...file,
            tagIds: file.tagIds ? file.tagIds.split(",").map(Number) : [],
          }));

          return {
            data: {
              files: result,
              totalPages,
              timeStamp: Date.now(),
            } as GetFilesResponse,
          };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get files",
          });
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.files.map(({ id }) => ({ type: "FILE", id }) as const),
              { type: "FILE", id: "LIST" },
              { type: "TAG", id: "LIST" },
            ]
          : [
              { type: "FILE", id: "LIST" },
              { type: "TAG", id: "LIST" },
            ],
    }),
    getFileById: builder.query<GetFileByIdResponse, GetFileByIdRequest>({
      queryFn: async (request: GetFileByIdRequest) => {
        try {
          const { fileId } = request;

          const db = await DatabaseManager.getInstance().getDbInstance();

          const [file]: (FileCommon & { tagIdsStr: string })[] =
            await db.select(
              `
            SELECT FileData.*, COALESCE((
              SELECT GROUP_CONCAT(Tag.id)
              FROM Tag
              JOIN FileTag ON Tag.id = FileTag.tag_id
              WHERE FileTag.file_id = FileData.id
            ), '') as tagIdsStr
            FROM FileData
            WHERE FileData.id = ?
            `,
              [fileId],
            );

          if (!file) {
            return Promise.reject({ message: "File not found" });
          }

          const result: FileCommon = {
            ...file,
            tagIds: file.tagIdsStr ? file.tagIdsStr.split(",").map(Number) : [],
          };

          let children: FileCommon[] = [];
          if (result.type.startsWith("Composition")) {
            const childFiles: (FileCommon & { tagIdsStr: string })[] =
              await db.select(
                `
              SELECT FileData.*, COALESCE((
                SELECT GROUP_CONCAT(Tag.id)
                FROM Tag
                JOIN FileTag ON Tag.id = FileTag.tag_id
                WHERE FileTag.file_id = FileData.id
              ), '') as tagIdsStr
              FROM FileData
              JOIN FileComposition ON FileData.id = FileComposition.file_id
              WHERE FileComposition.composite_file_id = ?
              `,
                [fileId],
              );
            children = childFiles.map((child) => ({
              ...child,
              tagIds: child.tagIdsStr
                ? child.tagIdsStr.split(",").map(Number)
                : [],
            }));
          }

          const response: GetFileByIdResponse = {
            file: result,
            fileChildren: children,
          };
          return { data: response };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get files",
          });
        }
      },
      providesTags: (result, _error, { fileId }) =>
        result
          ? [
              { type: "FILE", id: fileId },
              ...result.fileChildren.map(({ id }) => ({
                type: "FILE" as const,
                id,
              })),
            ]
          : [{ type: "FILE" as const, id: fileId }],
    }),
    scanFiles: builder.mutation<ScanFilesResponse, ScanFilesRequest>({
      queryFn: async () => {
        try {
          const db = await DatabaseManager.getInstance().getDbInstance();

          // Get store path
          const { coverPath: cover_dir_path, storehousePaths: scan_dir_path } =
            await getCoverAndStoreSetUp();

          // Get existing file paths
          const skipPaths = await getExistingFilePaths(db);

          const filesAndTypes = await getFilesAndTypes(scan_dir_path);

          const newFiles = filesAndTypes.filter(
            (file) => !skipPaths.includes(file.path),
          );

          const failedFiles: FileAndTypeInfo[] = [];
          const newFileData: FileDetailsWithId[] = [];
          const uniqueNames = await getUniqueNamesInFolder(
            cover_dir_path,
            newFiles.length,
          );
          let i = 0;

          for (const file of newFiles) {
            try {
              const uniqueName = uniqueNames[i++];
              const thumbnailPath = await createThumbnail(
                uniqueName,
                file.path,
                cover_dir_path,
                1,
                null,
              );

              newFileData.push({
                id: 0,
                name: file.name,
                path: file.path,
                type: file.file_type as FileType,
                rsa: null,
                description: "",
                coverPath: thumbnailPath,
              });
            } catch (error) {
              failedFiles.push(file);
            }
          }

          if (newFileData.length > 0) {
            const values = newFileData
              .map(() => "(?, ?, ?, ?, ?, ?)")
              .join(", ");

            const params = newFileData.flatMap((file) => [
              file.name,
              file.path,
              file.type,
              file.rsa,
              file.description,
              file.coverPath,
            ]);

            await db.execute(
              `
                INSERT INTO FileData (name, path, type, rsa, description, coverPath)
                VALUES ${values}
              `,
              params,
            );
          }

          const report = {
            results: newFileData,
            failedCount: failedFiles.length,
          } as ScanFilesResponse;

          return {
            data: report,
          };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get files",
          });
        }
      },
      invalidatesTags: [{ type: "FILE", id: "LIST" }],
    }),
    updateFile: builder.mutation<null, UpdateFileRequest>({
      queryFn: async (request) => {
        try {
          const { id, name, path, rsa, description, type, coverPath } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();

          // Dynamically build the SQL query based on the provided fields
          const updates: string[] = [];
          const params: (string | number | null)[] = [];

          if (name !== undefined) {
            updates.push("name = ?");
            params.push(name);
          }

          if (path !== undefined) {
            updates.push("path = ?");
            params.push(path);
          }

          if (rsa !== undefined) {
            updates.push("rsa = ?");
            params.push(rsa);
          }

          if (description !== undefined) {
            updates.push("description = ?");
            params.push(description);
          }

          if (type !== undefined) {
            updates.push("type = ?");
            params.push(type);
          }

          if (coverPath !== undefined) {
            const { coverPath: cover_dir_path } = await getCoverAndStoreSetUp();
            const uniqueName = await getUniqueNameInFolder(cover_dir_path);
            const thumbnailPath = await createThumbnail(
              uniqueName,
              coverPath,
              cover_dir_path,
              1,
              null,
            );
            updates.push("coverPath = ?");
            params.push(thumbnailPath);
          }

          if (updates.length === 0) {
            throw new Error("No fields provided to update");
          }

          params.push(id);
          const query = `UPDATE FileData SET ${updates.join(", ")} WHERE id = ?`;

          await db.execute(query, params);

          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to update file",
          });
        }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: "FILE", id }],
    }),
    updateCover: builder.mutation<null, UpdateCoverRequest>({
      queryFn: async (request) => {
        try {
          const { id, videoFilePath, time } = request;
          const { coverPath: cover_dir_path } = await getCoverAndStoreSetUp();
          const uniqueName = await getUniqueNameInFolder(cover_dir_path);
          const thumbnailPath = await createThumbnail(
            uniqueName,
            videoFilePath,
            cover_dir_path,
            null,
            time,
          );

          // Update the file's coverPath in the database
          const db = await DatabaseManager.getInstance().getDbInstance();
          await db.execute(
            `
              UPDATE FileData
              SET coverPath = ?
              WHERE id = ?
            `,
            [thumbnailPath, id],
          );

          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to update cover",
          });
        }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: "FILE", id }],
    }),
    deleteFile: builder.mutation<null, DeleteFileRequest>({
      queryFn: async (request) => {
        try {
          const { id } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();

          const [file]: { path: string | null }[] = await db.select(
            `SELECT path FROM FileData WHERE id = ?`,
            [id],
          );

          if (!file) {
            return Promise.reject({ message: "File not found" });
          }

          const { path } = file;
          if (path) {
            const existsPath = await exists(path);
            if (existsPath) {
              await removeFile(path);
            }
          }

          // Continue with the database deletions
          await db.execute(`DELETE FROM LibraryIncludeFile WHERE file_id = ?`, [
            id,
          ]);
          await db.execute(`DELETE FROM LibraryExcludeFile WHERE file_id = ?`, [
            id,
          ]);
          await db.execute(`DELETE FROM FileTag WHERE file_id = ?`, [id]);
          await db.execute(
            `DELETE FROM FileComposition WHERE composite_file_id = ?`,
            [id],
          );
          await db.execute(`DELETE FROM FileData WHERE id = ?`, [id]);

          return { data: null };
        } catch (error: unknown) {
          console.log(error);
          return Promise.reject({
            message: (error as Error).message || "Failed to delete file",
          });
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "FILE", id },
        { type: "FILE", id: "LIST" },
      ],
    }),
    deleteAllFiles: builder.mutation<null, void>({
      queryFn: async () => {
        try {
          const db = await DatabaseManager.getInstance().getDbInstance();
          await db.execute(`DELETE FROM LibraryIncludeFile`);
          await db.execute(`DELETE FROM LibraryExcludeFile`);
          await db.execute(`DELETE FROM FileTag`);
          await db.execute(`DELETE FROM FileComposition`);
          await db.execute(`DELETE FROM FileData`);

          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to delete all files",
          });
        }
      },
      invalidatesTags: () => [{ type: "FILE", id: "LIST" }],
    }),
    addTagToFile: builder.mutation<null, AddTagsToFileRequest>({
      queryFn: async (request) => {
        try {
          const { fileId, tagIds = [], tagNames = [] } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();

          const tempTags = [...tagIds];

          if (tagNames.length > 0) {
            const existingTags: { id: number }[] = await db.select(
              `SELECT id FROM Tag WHERE name IN (${tagNames.map(() => "?").join(", ")})`,
              tagNames,
            );
            tempTags.push(...existingTags.map((tag) => tag.id));
          }

          const tags = removeDuplicates(tempTags);

          if (tags.length === 0) {
            throw new Error("No valid tags provided");
          }

          for (const tagId of tags) {
            await db.execute(
              `
                INSERT INTO FileTag (file_id, tag_id)
                VALUES (?, ?)
                ON CONFLICT DO NOTHING
              `,
              [fileId, tagId],
            );
          }

          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to add tags to file",
          });
        }
      },
      invalidatesTags: (_result, _error, { fileId, tagIds }) => [
        { type: "FILE", id: fileId },
        ...(tagIds || []).map((id) => ({ type: "TAG", id }) as const),
      ],
    }),
    removeTagFromFile: builder.mutation<null, RemoveTagsFromFileRequest>({
      queryFn: async (request) => {
        try {
          const { fileId, tagIds = [] } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();

          const tempTags = [...tagIds];

          const tags = removeDuplicates(tempTags);

          if (tags.length === 0) {
            throw new Error("No valid tags provided");
          }

          for (const tagId of tags) {
            await db.execute(
              `
                DELETE FROM FileTag
                WHERE file_id = ? AND tag_id = ?
              `,
              [fileId, tagId],
            );
          }
          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message:
              (error as Error).message || "Failed to remove tags from file",
          });
        }
      },
      invalidatesTags: (_result, _error, { fileId, tagIds }) => [
        { type: "FILE", id: fileId },
        ...(tagIds || []).map((id) => ({ type: "TAG" as const, id })),
      ],
    }),
    updateTagsToFiles: builder.mutation<null, UpdateTagsRequest>({
      queryFn: async (request) => {
        try {
          const { fileIds, tagIds = [] } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();

          const tempTags = [...tagIds];

          const tags = removeDuplicates(tempTags);

          for (const fileId of fileIds) {
            const currentTags: { tag_id: number }[] = await db.select(
              `SELECT tag_id FROM FileTag WHERE file_id = ?`,
              [fileId],
            );

            const tagsToAdd = tags.filter(
              (tagId) => !currentTags.some((tag) => tag.tag_id === tagId),
            );
            const tagsToRemove = currentTags
              .filter((tag) => !tags.includes(tag.tag_id))
              .map((tag) => tag.tag_id);

            for (const tagId of tagsToRemove) {
              await db.execute(
                `DELETE FROM FileTag WHERE file_id = ? AND tag_id = ?`,
                [fileId, tagId],
              );
            }

            for (const tagId of tagsToAdd) {
              await db.execute(
                `INSERT INTO FileTag (file_id, tag_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
                [fileId, tagId],
              );
            }
          }

          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to update tags",
          });
        }
      },
      invalidatesTags: (_result, _error, { fileIds, tagIds }) => [
        ...fileIds.map((id) => ({ type: "FILE", id }) as const),
        ...(tagIds || []).map((id) => ({ type: "TAG", id }) as const),
      ],
    }),
    createCompositeFile: builder.mutation<null, CreateCompositeFileRequest>({
      queryFn: async (request) => {
        try {
          const { name, type, description, coverPath, childFilePaths } =
            request;
          const db = await DatabaseManager.getInstance().getDbInstance();

          const { coverPath: cover_dir_path } = await getCoverAndStoreSetUp();

          const uniqueName = await getUniqueNameInFolder(cover_dir_path);
          const thumbnailPath = await createThumbnail(
            uniqueName,
            coverPath,
            cover_dir_path,
            1,
            null,
          );

          // Create composite file
          const queryResult = await db.execute(
            `
              INSERT INTO FileData (name, type, description, coverPath, rsa, path)
              VALUES (?, ?, ?, ?, ?, NULL)
            `,
            [name, type, description, thumbnailPath, "~"],
          );

          const compositeFileId = queryResult.lastInsertId;

          // Add children to composite file
          const childFilePathsSet = Array.from(new Set(childFilePaths)); // Remove duplicates
          await Promise.all(
            childFilePathsSet.map(async (childFilePath) => {
              // Check if child file exists and update type if needed
              await db.execute(
                `
                  UPDATE FileData
                  SET type = CASE
                    WHEN type LIKE 'Child_%' THEN type
                    ELSE 'Child_' || type
                  END
                  WHERE path = ?
                `,
                [childFilePath],
              );

              // Add to FileComposition
              await db.execute(
                `
                  INSERT INTO FileComposition (composite_file_id, file_id)
                  SELECT ?, id
                  FROM FileData
                  WHERE path = ?
                  AND EXISTS (SELECT 1 FROM FileData WHERE path = ?)
                `,
                [compositeFileId, childFilePath, childFilePath],
              );
            }),
          );
          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get files",
          });
        }
      },
      invalidatesTags: [{ type: "FILE", id: "LIST" }],
    }),
    tagFiles: builder.mutation<number[], TagFileRequest>({
      queryFn: async (request) => {
        try {
          const { tagId, filePaths } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();

          // Get tag ID
          const tag: { id: number } = await selectOne(
            db,
            `SELECT id FROM Tag WHERE id = ?`,
            [tagId],
            {
              noDataFound: "No tag found",
              multipleRowsFound: "Multiple tags found",
              error: "Error finding tag",
            },
          );

          // Prepare and execute individual queries for adding tags to files
          const updatedFileIds: number[] = [];

          const queries = filePaths.map(async (filePath) => {
            const file: { id: number } | null = await selectOneOrNull(
              db,
              `SELECT id FROM FileData WHERE path = ?`,
              [filePath],
              {
                multipleRowsFound: "Multiple files found",
                error: "Error finding file",
              },
            );
            if (file) {
              updatedFileIds.push(file.id);
              await db.execute(
                `
                  INSERT INTO FileTag (file_id, tag_id)
                  SELECT ?, ?
                  WHERE NOT EXISTS (
                    SELECT 1 FROM FileTag WHERE file_id = ? AND tag_id = ?
                  )
                `,
                [file.id, tag.id, file.id, tag.id],
              );
            }
          });

          // Execute all queries asynchronously
          await Promise.all(queries);

          return { data: updatedFileIds };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to tag files",
          });
        }
      },
      invalidatesTags: (result, _error, { tagId }) => [
        { type: "FILE", id: "LIST" },
        ...(result || []).map((id) => ({ type: "FILE", id }) as const),
        { type: "TAG", id: tagId },
      ],
    }),
  }),
});

export const {
  useGetAllFilesQuery,
  useUpdateFileMutation,
  useDeleteFileMutation,
  useAddTagToFileMutation,
  useRemoveTagFromFileMutation,
  useScanFilesMutation,
  useCreateCompositeFileMutation,
  useGetFileByIdQuery,
  useDeleteAllFilesMutation,
  useUpdateTagsToFilesMutation,
  useUpdateCoverMutation,
  useTagFilesMutation,
} = fileApi;
