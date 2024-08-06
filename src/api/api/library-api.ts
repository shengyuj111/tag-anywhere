import { DatabaseManager } from "../database/database-manager";
import apiSlice from "../api-slice";
import { getCoverAndStoreSetUp, getUniqueNameInFolder } from "./helper";
import { createThumbnail } from "./rust-api";

export interface Library {
  id: number;
  name: string;
  coverPath: string;
  includeInName: string | null;
  includeTagIds?: number[];
  excludeTagIds?: number[];
  includeFileIds?: number[];
  excludeFileIds?: number[];
}

export interface LibraryReturnType {
  id: number;
  name: string;
  coverPath: string;
  includeInName: string | null;
  includeTagIds: string;
  excludeTagIds: string;
  includeFileIds: string;
  excludeFileIds: string;
}

export interface GetLibrariesRequest {
  includeInName?: string;
  sortOn?: string;
  isAscending?: boolean;
  pageSize?: number;
  page?: number;
}

export interface GetLibrariesResponse {
  libraries: Library[];
}

export interface GetLibraryByIdRequest {
  libraryId: number;
}

export interface UpdateLibraryRequest {
  id: number;
  name: string;
  coverPath: string;
  includeInName: string | null;
  includeTagIds: number[];
  excludeTagIds: number[];
  includeFileIds: number[];
  excludeFileIds: number[];
}

export interface CreateLibraryRequest {
  name: string;
  coverPath: string;
  includeInName: string | null;
  includeTagIds: number[];
  excludeTagIds: number[];
  includeFileIds: number[];
  excludeFileIds: number[];
}

export interface DeleteLibraryRequest {
  id: number;
}

export const libraryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllLibraries: builder.query<GetLibrariesResponse, GetLibrariesRequest>({
      queryFn: async (request) => {
        try {
          const {
            includeInName,
            sortOn,
            isAscending = true,
            pageSize,
            page
          } = request;
    
          const db = await DatabaseManager.getInstance().getDbInstance();
          let baseQuery = `FROM Library l
          LEFT JOIN LibraryIncludeTag lit ON l.id = lit.library_id
          LEFT JOIN LibraryExcludeTag let ON l.id = let.library_id
          LEFT JOIN LibraryIncludeFile lif ON l.id = lif.library_id
          LEFT JOIN LibraryExcludeFile lef ON l.id = lef.library_id`;
          const conditions: string[] = [];
          const params: (string | number)[] = [];
    
          if (includeInName) {
            conditions.push("l.name LIKE ?");
            params.push(`%${includeInName}%`);
          }
    
          if (conditions.length > 0) {
            baseQuery += " WHERE " + conditions.join(" AND ");
          }
    
          baseQuery += " GROUP BY l.id, l.name, l.coverPath, l.includeInName";
    
          // Query to count total libraries
          const countQuery = `SELECT COUNT(DISTINCT l.id) as total ${baseQuery}`;
          const countResult: { total: number }[] = await db.select(countQuery, params);
          const totalLibraries = countResult[0]?.total || 0;
    
          // Calculate total pages
          const totalPages = pageSize ? Math.ceil(totalLibraries / pageSize) : 1;
    
          // Main query to fetch libraries
          let query = `
            SELECT 
              l.id, l.name, l.coverPath, l.includeInName,
              GROUP_CONCAT(DISTINCT lit.tag_id) AS includeTagIds,
              GROUP_CONCAT(DISTINCT let.tag_id) AS excludeTagIds,
              GROUP_CONCAT(DISTINCT lif.file_id) AS includeFileIds,
              GROUP_CONCAT(DISTINCT lef.file_id) AS excludeFileIds
            ${baseQuery}
          `;
    
          if (sortOn) {
            query += ` ORDER BY l.${sortOn} ${isAscending ? 'ASC' : 'DESC'}`;
          }
    
          if (pageSize && page) {
            const offset = (page - 1) * pageSize;
            query += " LIMIT ? OFFSET ?";
            params.push(pageSize, offset);
          }
    
          const libraries: LibraryReturnType[] = await db.select(query, params);
          const formattedLibraries: Library[] = libraries.map((library) => ({
            ...library,
            includeTagIds: library.includeTagIds
              ? library.includeTagIds.split(",").map(Number)
              : [],
            excludeTagIds: library.excludeTagIds
              ? library.excludeTagIds.split(",").map(Number)
              : [],
            includeFileIds: library.includeFileIds
              ? library.includeFileIds.split(",").map(Number)
              : [],
            excludeFileIds: library.excludeFileIds
              ? library.excludeFileIds.split(",").map(Number)
              : [],
          }));
    
          return {
            data: {
              libraries: formattedLibraries,
              totalPages,
              currentPage: page || 1,
              totalLibraries
            } as GetLibrariesResponse,
          };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get libraries",
          });
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.libraries.flatMap((library) => [
                { type: "LIBRARY", id: library.id } as const,
                ...(library.includeTagIds || []).map(
                  (tagId) => ({ type: "Tag", id: tagId }) as const,
                ),
                ...(library.excludeTagIds || []).map(
                  (tagId) => ({ type: "Tag", id: tagId }) as const,
                ),
                ...(library.includeFileIds || []).map(
                  (fileId) => ({ type: "File", id: fileId }) as const,
                ),
                ...(library.excludeFileIds || []).map(
                  (fileId) => ({ type: "File", id: fileId }) as const,
                ),
              ]),
              { type: "LIBRARY", id: "LIST" },
            ]
          : [{ type: "LIBRARY", id: "LIST" }],
    }),
    getLibraryById: builder.query<Library, GetLibraryByIdRequest>({
      queryFn: async (request: GetLibraryByIdRequest) => {
        try {
          const { libraryId } = request;

          const db = await DatabaseManager.getInstance().getDbInstance();

          const [library]: LibraryReturnType[] = await db.select(
            `
              SELECT 
                l.id, l.name, l.coverPath, l.includeInName,
                GROUP_CONCAT(DISTINCT lit.tag_id) AS includeTagIds,
                GROUP_CONCAT(DISTINCT let.tag_id) AS excludeTagIds,
                GROUP_CONCAT(DISTINCT lif.file_id) AS includeFileIds,
                GROUP_CONCAT(DISTINCT lef.file_id) AS excludeFileIds
              FROM Library l
              LEFT JOIN LibraryIncludeTag lit ON l.id = lit.library_id
              LEFT JOIN LibraryExcludeTag let ON l.id = let.library_id
              LEFT JOIN LibraryIncludeFile lif ON l.id = lif.library_id
              LEFT JOIN LibraryExcludeFile lef ON l.id = lef.library_id
              WHERE l.id = ?
              GROUP BY l.id, l.name, l.coverPath, l.includeInName
              `,
            [libraryId],
          );

          if (!library) {
            return Promise.reject({ message: "Library not found" });
          }

          const formattedLibrary: Library = {
            ...library,
            includeTagIds: library.includeTagIds
              ? library.includeTagIds.split(",").map(Number)
              : [],
            excludeTagIds: library.excludeTagIds
              ? library.excludeTagIds.split(",").map(Number)
              : [],
            includeFileIds: library.includeFileIds
              ? library.includeFileIds.split(",").map(Number)
              : [],
            excludeFileIds: library.excludeFileIds
              ? library.excludeFileIds.split(",").map(Number)
              : [],
          };

          return { data: formattedLibrary };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get library",
          });
        }
      },
      providesTags: (result, _error, { libraryId }) =>
        result
          ? [
              { type: "LIBRARY", id: libraryId },
              ...(result.includeTagIds || []).map(
                (tagId) => ({ type: "Tag", id: tagId }) as const,
              ),
              ...(result.excludeTagIds || []).map(
                (tagId) => ({ type: "Tag", id: tagId }) as const,
              ),
              ...(result.includeFileIds || []).map(
                (fileId) => ({ type: "File", id: fileId }) as const,
              ),
              ...(result.excludeFileIds || []).map(
                (fileId) => ({ type: "File", id: fileId }) as const,
              ),
            ]
          : [{ type: "LIBRARY", id: libraryId }],
    }),
    updateLibrary: builder.mutation<null, UpdateLibraryRequest>({
      queryFn: async (request) => {
        try {
          const {
            id,
            name,
            coverPath,
            includeInName,
            includeTagIds,
            excludeTagIds,
            includeFileIds,
            excludeFileIds,
          } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();

          await db.execute(
            `
                UPDATE Library
                SET name = ?, coverPath = ?, includeInName = ?
                WHERE id = ?
              `,
            [name, coverPath, includeInName, id],
          );

          // Fetch current tags and file IDs
          const currentIncludeTagIds: { tag_id: number }[] = await db.select(
            `SELECT tag_id FROM LibraryIncludeTag WHERE library_id = ?`,
            [id],
          );
          const currentExcludeTagIds: { tag_id: number }[] = await db.select(
            `SELECT tag_id FROM LibraryExcludeTag WHERE library_id = ?`,
            [id],
          );
          const currentIncludeFileIds: { file_id: number }[] = await db.select(
            `SELECT file_id FROM LibraryIncludeFile WHERE library_id = ?`,
            [id],
          );
          const currentExcludeFileIds: { file_id: number }[] = await db.select(
            `SELECT file_id FROM LibraryExcludeFile WHERE library_id = ?`,
            [id],
          );

          const currentIncludeTagSet = new Set(
            currentIncludeTagIds.map((row) => row.tag_id),
          );
          const currentExcludeTagSet = new Set(
            currentExcludeTagIds.map((row) => row.tag_id),
          );
          const currentIncludeFileSet = new Set(
            currentIncludeFileIds.map((row) => row.file_id),
          );
          const currentExcludeFileSet = new Set(
            currentExcludeFileIds.map((row) => row.file_id),
          );

          // Calculate the differences
          const includeTagsToAdd = includeTagIds.filter(
            (tagId) => !currentIncludeTagSet.has(tagId),
          );
          const includeTagsToRemove = [...currentIncludeTagSet].filter(
            (tagId) => !includeTagIds.includes(tagId),
          );
          const excludeTagsToAdd = excludeTagIds.filter(
            (tagId) => !currentExcludeTagSet.has(tagId),
          );
          const excludeTagsToRemove = [...currentExcludeTagSet].filter(
            (tagId) => !excludeTagIds.includes(tagId),
          );
          const includeFilesToAdd = includeFileIds.filter(
            (fileId) => !currentIncludeFileSet.has(fileId),
          );
          const includeFilesToRemove = [...currentIncludeFileSet].filter(
            (fileId) => !includeFileIds.includes(fileId),
          );
          const excludeFilesToAdd = excludeFileIds.filter(
            (fileId) => !currentExcludeFileSet.has(fileId),
          );
          const excludeFilesToRemove = [...currentExcludeFileSet].filter(
            (fileId) => !excludeFileIds.includes(fileId),
          );

          // Perform necessary updates
          for (const tagId of includeTagsToAdd) {
            await db.execute(
              `INSERT INTO LibraryIncludeTag (library_id, tag_id) VALUES (?, ?)`,
              [id, tagId],
            );
          }
          for (const tagId of includeTagsToRemove) {
            await db.execute(
              `DELETE FROM LibraryIncludeTag WHERE library_id = ? AND tag_id = ?`,
              [id, tagId],
            );
          }
          for (const tagId of excludeTagsToAdd) {
            await db.execute(
              `INSERT INTO LibraryExcludeTag (library_id, tag_id) VALUES (?, ?)`,
              [id, tagId],
            );
          }
          for (const tagId of excludeTagsToRemove) {
            await db.execute(
              `DELETE FROM LibraryExcludeTag WHERE library_id = ? AND tag_id = ?`,
              [id, tagId],
            );
          }
          for (const fileId of includeFilesToAdd) {
            await db.execute(
              `INSERT INTO LibraryIncludeFile (library_id, file_id) VALUES (?, ?)`,
              [id, fileId],
            );
          }
          for (const fileId of includeFilesToRemove) {
            await db.execute(
              `DELETE FROM LibraryIncludeFile WHERE library_id = ? AND file_id = ?`,
              [id, fileId],
            );
          }
          for (const fileId of excludeFilesToAdd) {
            await db.execute(
              `INSERT INTO LibraryExcludeFile (library_id, file_id) VALUES (?, ?)`,
              [id, fileId],
            );
          }
          for (const fileId of excludeFilesToRemove) {
            await db.execute(
              `DELETE FROM LibraryExcludeFile WHERE library_id = ? AND file_id = ?`,
              [id, fileId],
            );
          }

          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to update library",
          });
        }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: "LIBRARY", id }],
    }),
    createLibrary: builder.mutation<null, CreateLibraryRequest>({
      queryFn: async (request) => {
        try {
          const {
            name,
            coverPath,
            includeInName,
            includeTagIds,
            excludeTagIds,
            includeFileIds,
            excludeFileIds,
          } = request;
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

          const result = await db.execute(
            `
              INSERT INTO Library (name, coverPath, includeInName)
              VALUES (?, ?, ?)
            `,
            [name, thumbnailPath, includeInName],
          );

          const libraryId = result.lastInsertId;

          for (const tagId of includeTagIds) {
            await db.execute(
              `INSERT INTO LibraryIncludeTag (library_id, tag_id) VALUES (?, ?)`,
              [libraryId, tagId],
            );
          }
          for (const tagId of excludeTagIds) {
            await db.execute(
              `INSERT INTO LibraryExcludeTag (library_id, tag_id) VALUES (?, ?)`,
              [libraryId, tagId],
            );
          }
          for (const fileId of includeFileIds) {
            await db.execute(
              `INSERT INTO LibraryIncludeFile (library_id, file_id) VALUES (?, ?)`,
              [libraryId, fileId],
            );
          }
          for (const fileId of excludeFileIds) {
            await db.execute(
              `INSERT INTO LibraryExcludeFile (library_id, file_id) VALUES (?, ?)`,
              [libraryId, fileId],
            );
          }

          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to create library",
          });
        }
      },
      invalidatesTags: [{ type: "LIBRARY_LIST", id: "LIST" }],
    }),
    deleteLibrary: builder.mutation<null, DeleteLibraryRequest>({
      queryFn: async (request) => {
        try {
          const { id } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();

          await db.execute(
            `DELETE FROM LibraryIncludeTag WHERE library_id = ?`,
            [id],
          );
          await db.execute(
            `DELETE FROM LibraryExcludeTag WHERE library_id = ?`,
            [id],
          );
          await db.execute(
            `DELETE FROM LibraryIncludeFile WHERE library_id = ?`,
            [id],
          );
          await db.execute(
            `DELETE FROM LibraryExcludeFile WHERE library_id = ?`,
            [id],
          );
          await db.execute(`DELETE FROM Library WHERE id = ?`, [id]);

          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to delete library",
          });
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "LIBRARY", id },
        { type: "LIBRARY_LIST", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAllLibrariesQuery,
  useGetLibraryByIdQuery,
  useUpdateLibraryMutation,
  useCreateLibraryMutation,
  useDeleteLibraryMutation,
} = libraryApi;
