import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookForm } from "../create/forms";
import {
  CreateCompositeFileRequest,
  fileTypes,
  useCreateCompositeFileMutation,
} from "@/api/api/file-api";
import { toast } from "@/components/ui/use-toast";
import { useContext } from "react";
import { DialogContext } from "@/components/provider/dialog-provider/dialog-service-provider";
import { BookForm } from "../create/book-form";

const CreateBookDialog = () => {
  const dialogManager = useContext(DialogContext).manager;
  const [createCompoundFile, { isLoading }] = useCreateCompositeFileMutation();
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
  return (
    <DialogContent className="gap-8 max-w-[620px] min-w-[620px]">
      <DialogHeader>
        <DialogTitle>Create Book</DialogTitle>
        <DialogDescription>
          Create a new book by selecting files
        </DialogDescription>
      </DialogHeader>
      <div>
        <BookForm
          form={form}
          onSubmit={onSubmit}
          onCancel={() => dialogManager.closeDialog()}
          isSubmitting={isLoading}
          submitButtonText="Create Book"
        />
      </div>
    </DialogContent>
  );
};

export default CreateBookDialog;
