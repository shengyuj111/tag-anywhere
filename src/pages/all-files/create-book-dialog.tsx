import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCreateBookForm } from "../create/book-form/form";
import { useContext } from "react";
import { DialogContext } from "@/components/provider/dialog-provider/dialog-service-provider";
import { BookForm } from "../create/book-form/book-form";

const CreateBookDialog = () => {
  const dialogManager = useContext(DialogContext).manager;
  const { form, onSubmit, isLoading } = useCreateBookForm();

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
