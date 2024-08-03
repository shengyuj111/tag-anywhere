import { DatabaseManager } from "../database/database-manager";
import apiSlice from "../api-slice";
import {
  copyFileToDir,
  createThumbnail,
  FileAndTypeInfo,
  getFilesAndTypes,
} from "./rust-api";
import {
  getCoverPath,
  getCoverPathBySetUp,
  getExistingFilePaths,
  getStorePathConfig,
  isFileCoverNameUnique,
} from "./helper";
import { v4 as uuidv4 } from "uuid";
import { removeDuplicates } from "@/lib/collection-utils";
import { extractFilenameAndExtension } from "@/lib/path-utils";
import { selectOne, selectOneOrNull } from "./database-helper";

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

type FileDetails = {
  id: number;
  name: string;
  path: string;
  type: FileType;
  rsa: string | null;
  description: string;
  coverPath: string | null;
};

export const isFileComposition = (file: FileCommon): boolean => {
  return file.type.startsWith("Composition");
};

export const isFileChild = (file: FileCommon): boolean => {
  return file.type.startsWith("Child");
};

export const getFileDisplayType = (file: FileCommon): string => {
  if (isFileComposition(file)) {
    return "Composition";
  } else {
    return fileTypeMap[file.type].displayType;
  }
};

export type FileCommon = {
  tags: string[];
} & FileDetails;

export type GetFilesDatabaseResponse = {
  tags: string;
} & FileDetails;

export type GetFilesRequest = {
  nameRegex?: string;
  includeTags?: string[];
  excludeTags?: string[];
  includeFileIds?: number[];
  excludeFileIds?: number[];
  pageSize?: number;
  page?: number;
};

export type GetFilesResponse = {
  files: FileCommon[];
  totalPages: number;
  timeStamp: number;
};

export type UpdateFileRequest = object & FileDetails;

export type UpdateCoverRequest = {
  time: number;
  id: number;
  coverPath: string;
  filePath: string;
};

export type DeleteFileRequest = {
  id: number;
};

export type AddTagsToFileRequest = {
  fileId: number;
  tagIds?: number[];
  tagNames?: string[];
};

export type RemoveTagsFromFileRequest = {
  fileId: number;
  tagIds?: number[];
  tagNames?: string[];
};

export type UpdateTagsRequest = {
  fileIds: number[];
  tagIds?: number[];
  tagNames?: string[];
};

export type ScanFilesRequest = void;

export type ScanFilesResponse = {
  results: FileCommon[];
  failedCount: number;
};

export type CreateCompositeFileRequest = {
  name: string;
  type: string;
  description: string;
  coverPath: string;
  childFilePaths: string[];
};

export type GetFileByIdRequest = {
  fileId: number;
};

export type CreateFileResponse = {
  file: FileCommon;
  fileChildren: FileCommon[];
  timeStamp: number;
};

export type TagFileRequest = {
  tagName: string;
  filePaths: string[];
};

export const fileApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllFiles: builder.query<GetFilesResponse, GetFilesRequest>({
      queryFn: async (request) => {
        try {
          const {
            nameRegex,
            includeTags,
            excludeTags,
            includeFileIds,
            excludeFileIds,
            pageSize,
            page,
          } = request;

          const db = await DatabaseManager.getInstance().getDbInstance();

          let baseQuery = `
            FROM FileData
          `;
          const conditions: string[] = [];
          const params: (string | number)[] = [];

          if (nameRegex) {
            conditions.push("FileData.name REGEXP ?");
            params.push(nameRegex);
          }

          if (includeTags && includeTags.length > 0) {
            conditions.push(
              `FileData.id IN (
                SELECT file_id FROM FileTag
                JOIN Tag ON FileTag.tag_id = Tag.id
                WHERE Tag.name IN (${includeTags.map(() => "?").join(", ")})
              )`,
            );
            params.push(...includeTags);
          }

          if (excludeTags && excludeTags.length > 0) {
            conditions.push(
              `FileData.id NOT IN (
                SELECT file_id FROM FileTag
                JOIN Tag ON FileTag.tag_id = Tag.id
                WHERE Tag.name IN (${excludeTags.map(() => "?").join(", ")})
              )`,
            );
            params.push(...excludeTags);
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
              SELECT GROUP_CONCAT(Tag.name)
              FROM Tag
              JOIN FileTag ON Tag.id = FileTag.tag_id
              WHERE FileTag.file_id = FileData.id
            ), '') as tags
            ${baseQuery}
            GROUP BY FileData.id
          `;

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
            tags: file.tags ? file.tags.split(",") : [],
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
              { type: "FILE_LIST", id: "LIST" },
              { type: "TAG", id: "LIST" },
            ]
          : [
              { type: "FILE_LIST", id: "LIST" },
              { type: "TAG", id: "LIST" },
            ],
    }),
    getFileById: builder.query<CreateFileResponse, GetFileByIdRequest>({
      queryFn: async (request: GetFileByIdRequest) => {
        try {
          const { fileId } = request;
          console.log("get file by id ", fileId);

          const db = await DatabaseManager.getInstance().getDbInstance();

          const [file]: (FileCommon & { tagsStr: string })[] = await db.select(
            `
            SELECT FileData.*, COALESCE((
              SELECT GROUP_CONCAT(Tag.name)
              FROM Tag
              JOIN FileTag ON Tag.id = FileTag.tag_id
              WHERE FileTag.file_id = FileData.id
            ), '') as tagsStr
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
            tags: file.tagsStr ? file.tagsStr.split(",") : [],
          };

          let children: FileCommon[] = [];
          if (result.type.startsWith("Composition")) {
            const childFiles: (FileCommon & { tagsStr: string })[] =
              await db.select(
                `
              SELECT FileData.*, COALESCE((
                SELECT GROUP_CONCAT(Tag.name)
                FROM Tag
                JOIN FileTag ON Tag.id = FileTag.tag_id
                WHERE FileTag.file_id = FileData.id
              ), '') as tagsStr
              FROM FileData
              JOIN FileComposition ON FileData.id = FileComposition.file_id
              WHERE FileComposition.composite_file_id = ?
              `,
                [fileId],
              );
            children = childFiles.map((child) => ({
              ...child,
              tags: child.tagsStr ? child.tagsStr.split(",") : [],
            }));
          }

          const response: CreateFileResponse = {
            file: result,
            fileChildren: children,
            timeStamp: Date.now(),
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
          const setUp = await getStorePathConfig();
          const cover_dir_path = getCoverPathBySetUp(setUp);
          const scan_dir_path = setUp.storehousePath;

          const db = await DatabaseManager.getInstance().getDbInstance();

          const skipPaths = await getExistingFilePaths(db);
          const filesAndTypes: FileAndTypeInfo[] =
            await getFilesAndTypes(scan_dir_path);

          const newFiles = filesAndTypes.filter(
            (file) => !skipPaths.includes(file.path),
          );

          const failedFiles: FileAndTypeInfo[] = [];
          const newFileData: FileDetails[] = [];

          for (const file of newFiles) {
            try {
              let isUnique = false;
              let uniqueName = "";

              while (!isUnique) {
                uniqueName = `${uuidv4()}`;
                isUnique = await isFileCoverNameUnique(
                  db,
                  uniqueName,
                  cover_dir_path,
                );
              }

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
      invalidatesTags: [{ type: "FILE_LIST", id: "LIST" }],
    }),
    updateFile: builder.mutation<null, UpdateFileRequest>({
      queryFn: async (request) => {
        try {
          const { id, name, path, rsa, description, type, coverPath } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();
          await db.execute(
            `
              UPDATE FileData
              SET name = ?, path = ?, type = ?, coverPath = ?, description = ?, rsa = ?
              WHERE id = ?
            `,
            [name, path, type, coverPath, description, rsa, id],
          );
          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get files",
          });
        }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: "FILE", id }],
    }),
    updateCover: builder.mutation<null, UpdateCoverRequest>({
      queryFn: async (request) => {
        try {
          const { coverPath, filePath, time } = request;
          const [coverName] = extractFilenameAndExtension(coverPath);
          const cover_dir_path = await getCoverPath();

          await createThumbnail(
            coverName,
            filePath,
            cover_dir_path,
            null,
            time,
          );
          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get files",
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

          await db.execute(`DELETE FROM FileTag WHERE file_id = ?`, [id]);
          await db.execute(
            `DELETE FROM FileComposition WHERE composite_file_id = ?`,
            [id],
          );
          await db.execute(`DELETE FROM FileData WHERE id = ?`, [id]);

          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get files",
          });
        }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: "FILE", id }],
    }),
    deleteAllFiles: builder.mutation<null, void>({
      queryFn: async () => {
        try {
          const db = await DatabaseManager.getInstance().getDbInstance();
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
      invalidatesTags: () => [{ type: "FILE_LIST" }],
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
      invalidatesTags: (_result, _error, { fileId }) => [
        { type: "FILE", id: fileId },
      ],
    }),
    removeTagFromFile: builder.mutation<null, RemoveTagsFromFileRequest>({
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
      invalidatesTags: (_result, _error, { fileId }) => [
        { type: "FILE", id: fileId },
      ],
    }),
    updateTagsToFiles: builder.mutation<null, UpdateTagsRequest>({
      queryFn: async (request) => {
        try {
          const { fileIds, tagIds = [], tagNames = [] } = request;
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
      invalidatesTags: (_result, _error, { fileIds }) => [
        ...fileIds.map((id) => ({ type: "FILE", id })),
      ],
    }),
    createCompositeFile: builder.mutation<null, CreateCompositeFileRequest>({
      queryFn: async (request) => {
        try {
          const { name, type, description, coverPath, childFilePaths } =
            request;
          const db = await DatabaseManager.getInstance().getDbInstance();

          const setUp = await getStorePathConfig();
          const cover_dir_path = getCoverPathBySetUp(setUp);
          const newCoverPath = await copyFileToDir(coverPath, cover_dir_path);

          // Create composite file
          const queryResult = await db.execute(
            `
              INSERT INTO FileData (name, type, description, coverPath, rsa, path)
              VALUES (?, ?, ?, ?, ?, NULL)
            `,
            [name, type, description, newCoverPath, "~"],
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
      invalidatesTags: [{ type: "FILE_LIST", id: "LIST" }],
    }),
    tagFiles: builder.mutation<null, TagFileRequest>({
      queryFn: async (request) => {
        try {
          const { tagName, filePaths } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();

          // Get tag ID
          const tag: { id: number } = await selectOne(
            db,
            `SELECT id FROM Tag WHERE name = ?`,
            [tagName],
            {
              noDataFound: "No tag found",
              multipleRowsFound: "Multiple tags found",
              error: "Error finding tag",
            },
          );

          // Prepare and execute individual queries for adding tags to files
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

          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to tag files",
          });
        }
      },
      invalidatesTags: () => [{ type: "FILE_LIST", id: "LIST" }],
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
