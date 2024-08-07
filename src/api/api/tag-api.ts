import { DatabaseManager } from "../database/database-manager";
import apiSlice from "../api-slice";
import { createThumbnail } from "./rust-api";
import { getCoverAndStoreSetUp, getUniqueNameInFolder } from "./helper";

export const tagTypes = ["default", "composite"] as const;
export type TagType = (typeof tagTypes)[number];

export interface TagCommon {
  id: number;
  name: string;
  type: TagType;
  color: string | null;
  description: string;
  coverPath: string;
}

export interface GetTagsRequest {
  includeInName?: string;
  pageSize?: number;
  page?: number;
  sortOn?: string;
  isAscending?: boolean;
}

export interface GetTagsResponse {
  tags: TagCommon[];
  totalPages: number;
  currentPage: number;
  totalTags: number;
}

export interface GetTagByIdRequest {
  id: number;
}

export interface GetTagByIdResponse {
  tag: TagCommon;
  fileIds: number[];
}

export interface GetTagByNameRequest {
  name: string;
}

export interface CreateTagRequest extends Omit<TagCommon, "id"> {}

export interface UpdateTagRequest extends TagCommon {}

export interface DeleteTagRequest {
  id: number;
}

export interface GetTagFileNumberRequest {
  id: number;
}

export interface GetTagFileNumberResponse {
  numOfFiles: number;
}

export const tagApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllTags: builder.query<GetTagsResponse, GetTagsRequest>({
      queryFn: async (request) => {
        try {
          const {
            includeInName,
            sortOn,
            isAscending = true,
            pageSize,
            page,
          } = request;

          const db = await DatabaseManager.getInstance().getDbInstance();
          let baseQuery = `FROM Tag`;
          const conditions: string[] = [];
          const params: (string | number)[] = [];

          if (includeInName) {
            conditions.push("Tag.name LIKE ?");
            params.push(`%${includeInName}%`);
          }

          if (conditions.length > 0) {
            baseQuery += " WHERE " + conditions.join(" AND ");
          }

          // Query to count total tags
          const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
          const countResult: { total: number }[] = await db.select(
            countQuery,
            params,
          );
          const totalTags = countResult[0]?.total || 0;

          // Calculate total pages
          const totalPages = pageSize ? Math.ceil(totalTags / pageSize) : 1;

          // Main query to fetch tags
          let query = `
            SELECT id, name, type, color, coverPath, description
            ${baseQuery}
          `;

          if (sortOn) {
            query += ` ORDER BY ${sortOn} ${isAscending ? "ASC" : "DESC"}`;
          }

          if (pageSize && page) {
            const offset = (page - 1) * pageSize;
            query += " LIMIT ? OFFSET ?";
            params.push(pageSize, offset);
          }

          const tags: TagCommon[] = await db.select(query, params);

          return {
            data: {
              tags,
              totalPages: totalPages,
              currentPage: page || 1,
              totalTags: totalTags,
            } as GetTagsResponse,
          };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get tags",
          });
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.tags.map(({ id }) => ({ type: "TAG", id }) as const),
              { type: "TAG", id: "LIST" },
            ]
          : [{ type: "TAG", id: "LIST" }],
    }),
    getTagById: builder.query<GetTagByIdResponse, GetTagByIdRequest>({
      queryFn: async (request) => {
        try {
          const { id } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();
          const tags: TagCommon[] = await db.select(
            `
              SELECT id, name, type, color, coverPath, description
              FROM Tag
              WHERE id = ?
            `,
            [id],
          );
          if (!tags || tags.length === 0) {
            return Promise.reject({ message: "Tag not found" });
          }
          const fileIds: { fileId: number }[] = await db.select(
            `
              SELECT file_Id as fileId
              FROM FileTag
              WHERE tag_id = ?
            `,
            [id],
          );

          return {
            data: {
              tag: tags[0],
              fileIds: fileIds.map(({ fileId }) => fileId),
            } as GetTagByIdResponse,
          };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get tag",
          });
        }
      },
      providesTags: (_result, _error, { id }) => [{ type: "TAG", id }],
    }),
    getTagFileNumber: builder.query<
      GetTagFileNumberResponse,
      GetTagFileNumberRequest
    >({
      queryFn: async (request) => {
        try {
          const { id } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();
          const fileIds: { fileId: number }[] = await db.select(
            `
              SELECT file_Id as fileId
              FROM FileTag
              WHERE tag_id = ?
            `,
            [id],
          );
          return {
            data: { numOfFiles: fileIds.length } as GetTagFileNumberResponse,
          };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get tag",
          });
        }
      },
      providesTags: (_result, _error, { id }) => [{ type: "TAG", id }],
    }),
    createTag: builder.mutation<null, CreateTagRequest>({
      queryFn: async (request) => {
        try {
          const { name, type, description, color, coverPath } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();
          const { coverPath: cover_dir_path } = await getCoverAndStoreSetUp();

          const uniqueName = await getUniqueNameInFolder(cover_dir_path);
          console.log("uniqueName", uniqueName);
          const thumbnailPath = await createThumbnail(
            uniqueName,
            coverPath,
            cover_dir_path,
            1,
            null,
          );

          await db.execute(
            `
              INSERT INTO Tag (name, type, description, color, coverPath)
              VALUES (?, ?, ?, ?, ?)
            `,
            [name, type, description, color, thumbnailPath],
          );
          return { data: null };
        } catch (error: unknown) {
          if (
            error instanceof Error &&
            error.message.includes("UNIQUE constraint failed: Tag.name")
          ) {
            return Promise.reject({ message: "Tag name must be unique" });
          }
          return Promise.reject({
            message: (error as Error).message || "Failed to create tag",
          });
        }
      },
      invalidatesTags: [{ type: "TAG", id: "LIST" }],
    }),
    updateTag: builder.mutation<null, UpdateTagRequest>({
      queryFn: async (request) => {
        try {
          const { id, name, type, color, coverPath, description } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();
          await db.execute(
            `
              UPDATE Tag
              SET name = ?, type = ?, color = ?, coverPath = ?, description = ?
              WHERE id = ?
            `,
            [name, type, color, coverPath, description, id],
          );
          return { data: null };
        } catch (error: unknown) {
          if (
            error instanceof Error &&
            error.message.includes("UNIQUE constraint failed: Tag.name")
          ) {
            return Promise.reject({ message: "Tag name must be unique" });
          }
          return Promise.reject({
            message: (error as Error).message || "Failed to update tag",
          });
        }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: "TAG", id }],
    }),
    deleteTag: builder.mutation<null, DeleteTagRequest>({
      queryFn: async (request) => {
        try {
          const { id } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();

          await db.execute(
            `
              DELETE FROM TagComposition
              WHERE composite_tag_id = ? OR tag_id = ?
            `,
            [id, id],
          );

          await db.execute(
            `
              DELETE FROM FileTag
              WHERE tag_id = ?
            `,
            [id],
          );

          await db.execute(
            `
              DELETE FROM Tag
              WHERE id = ?
            `,
            [id],
          );

          return { data: null };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to delete tag",
          });
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "TAG", id },
        { type: "TAG", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAllTagsQuery,
  useGetTagByIdQuery,
  useGetTagFileNumberQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} = tagApi;
