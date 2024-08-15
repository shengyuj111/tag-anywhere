import {
  CreateCompositeFileRequest,
  fileTypes,
  useCreateCompositeFileMutation,
} from "@/api/api/file-api";
import { getSettings } from "@/api/api/settings-api";
import { DialogContext } from "@/components/provider/dialog-provider/dialog-service-provider";
import { toast } from "@/components/ui/use-toast";
import { hasDuplicates } from "@/lib/collection-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const bookForm = z.object({
  bookName: z.string().min(2).max(50),
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
        const setup = await getSettings();
        if (!setup) {
          return false;
        }
        const storehousePath = setup.storehousePath!;
        return paths.every((path) => path.startsWith(storehousePath));
      },
      { message: "Only files in the store path are allowed" },
    ),
});

export const useCreateBookForm = () => {
  const [createCompoundFile, { isLoading }] = useCreateCompositeFileMutation();
  const dialogManager = useContext(DialogContext).manager;
  const form = useForm<z.infer<typeof bookForm>>({
    resolver: zodResolver(bookForm),
    defaultValues: {
      bookName: "",
      type: fileTypes[6],
      description: "",
      coverPath: "",
      childFilePaths: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof bookForm>) => {
    try {
      await createCompoundFile({
        ...values,
        name: values.bookName,
      } as CreateCompositeFileRequest);
      toast({
        title: "Book Created",
        description: "Book has been created",
      });
      dialogManager.closeDialog();
      return true;
    } catch (error) {
      toast({
        title: "Failed to create book",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    }
  };
  return { form, onSubmit, isLoading };
};
