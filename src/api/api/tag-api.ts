import { DatabaseManager } from "../database/database-manager";
import apiSlice from "../api-slice";
import { copyFileToDir } from "./rust-api";
import { getCoverPathBySetUp, getStorePathConfig } from "./helper";

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

export interface GetTagsRequest {}

export interface GetTagByIdRequest {
  id: number;
}

export interface GetTagByNameRequest {
  name: string;
}

export interface CreateTagRequest extends Omit<TagCommon, "id"> {}

export interface UpdateTagRequest extends TagCommon {}

export interface DeleteTagRequest {
  id: number;
}


export const tagApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllTags: builder.query<TagCommon[], GetTagsRequest>({
      queryFn: async () => {
        try {
          const db = await DatabaseManager.getInstance().getDbInstance();
          const tags: TagCommon[] = await db.select(
            `
              SELECT id, name, type, color, coverPath, description
              FROM Tag
            `,
            [],
          );
          return { data: tags };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get tags",
          });
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "TAG", id }) as const),
              { type: "TAG_LIST", id: "LIST" },
            ]
          : [{ type: "TAG_LIST", id: "LIST" }],
    }),
    getTagById: builder.query<TagCommon, GetTagByIdRequest>({
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
          return { data: tags[0] };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get tag",
          });
        }
      },
      providesTags: (_result, _error, { id }) => [{ type: "TAG", id }],
    }),
    getTagByName: builder.query<TagCommon, GetTagByNameRequest>({
      queryFn: async (request) => {
        try {
          const { name } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();
          const tags: TagCommon[] = await db.select(
            `
              SELECT id, name, type, color, coverPath, description
              FROM Tag
              WHERE name = ?
            `,
            [name],
          );
          if (!tags || tags.length === 0) {
            return Promise.reject({ message: "Tag not found" });
          }
          return { data: tags[0] };
        } catch (error: unknown) {
          return Promise.reject({
            message: (error as Error).message || "Failed to get tag",
          });
        }
      },
      providesTags: (_result) => [{ type: "TAG", id: _result?.id }],
    }),
    createTag: builder.mutation<null, CreateTagRequest>({
      queryFn: async (request) => {
        try {
          const { name, type, description, color, coverPath } = request;
          const db = await DatabaseManager.getInstance().getDbInstance();
          const setup = await getStorePathConfig();
          const coverDirPath = getCoverPathBySetUp(setup);
          const newCoverPath = await copyFileToDir(coverPath, coverDirPath);

          await db.execute(
            `
              INSERT INTO Tag (name, type, description, color, coverPath)
              VALUES (?, ?, ?, ?, ?)
            `,
            [name, type, description, color, newCoverPath],
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
      invalidatesTags: [{ type: "TAG_LIST", id: "LIST" }],
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
      invalidatesTags: (_result, _error, { id }) => [{ type: "TAG", id }],
    }),
  }),
});

export const {
  useGetAllTagsQuery,
  useGetTagByIdQuery,
  useGetTagByNameQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} = tagApi;
