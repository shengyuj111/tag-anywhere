import { tagTypes, useCreateTagMutation } from "@/api/api/tag-api";
import { DatabaseManager } from "@/api/database/database-manager";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

export const tagForm = z.object({
  tagName: z
    .string()
    .min(2)
    .max(200)
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

export const useCreateTagForm = () => {
  const [createTag, { isLoading: isCreatingTag }] = useCreateTagMutation();

  const form = useForm<z.infer<typeof tagForm>>({
    resolver: zodResolver(tagForm),
    defaultValues: {
      tagName: "",
      type: "default",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof tagForm>) => {
    try {
      await createTag({
        ...values,
        name: values.tagName,
        color: null,
      });
      toast({
        title: "Tag Created",
        description: "Tag has been created",
      });
      return true;
    } catch (error) {
      toast({
        title: "Failed to create tag",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    }
  };

  return { form, onSubmit, isCreatingTag };
};
