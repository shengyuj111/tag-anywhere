import { fileTypes } from "@/api/api/file-api";
import { StoreSetUpRequest } from "@/api/api/setup-api";
import { tagTypes } from "@/api/api/tag-api";
import { DatabaseManager } from "@/api/database/database-manager";
import { hasDuplicates } from "@/lib/collection-utils";
import { Store } from "tauri-plugin-store-api";
import { z } from "zod";

const checkDuplicateTagName = async (name: string) => {
  try {
    const db = await DatabaseManager.getInstance().getDbInstance();
    const existingTag = await db.select<{ count: number }[]>(
      `
          SELECT COUNT(*) as count
          FROM Tag
          WHERE name = ?
        `,
      [name],
    );
    return existingTag.length > 0 && existingTag[0].count > 0;
  } catch (error) {
    console.error("Failed to check duplicate tag name:", error);
    return false;
  }
};

export const createTagForm = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .refine(
      async (name) => {
        const isDuplicate = await checkDuplicateTagName(name);
        return !isDuplicate;
      },
      {
        message: "Tag name already exists",
      },
    ),
  type: z.enum(tagTypes),
  description: z.string(),
  coverPath: z.string(),
});

export const createBookForm = z.object({
  name: z.string().min(2).max(50),
  type: z.enum(fileTypes),
  description: z.string(),
  coverPath: z.string(),
  childFilePaths: z
    .array(z.string())
    .refine((paths) => paths.length > 0 && !hasDuplicates(paths), {
      message: "Duplicate file paths found",
    })
    .refine(
      async (paths) => {
        const store = new Store(".settings.dat");
        const setup = await store.get<StoreSetUpRequest>("setup");
        if (!setup) {
          return false;
        }
        const storehousePath = setup.storehousePath;
        return paths.every((path) => path.startsWith(storehousePath));
      },
      { message: "Only files in the store path are allowed" },
    ),
});

export const createLibraryForm = z.object({
  name: z.string().min(2).max(50),
  type: z.enum(fileTypes),
  description: z.string(),
  coverPath: z.string(),
  childFilePaths: z
    .array(z.string())
    .refine((paths) => paths.length > 0 && hasDuplicates(paths) === false, {
      message: "Duplicate file paths found",
    }),
});
