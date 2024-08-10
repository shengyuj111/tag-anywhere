import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UploadIcon } from "lucide-react";
import { open } from "@tauri-apps/api/dialog";
import { cn } from "@/lib/utils";
import { tagForm } from "./forms";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loaders } from "@/components/ui/loaders";

interface TagFormProps {
  form: ReturnType<typeof useForm<z.infer<typeof tagForm>>>;
  onSubmit: (values: z.infer<typeof tagForm>) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export const TagForm = ({
  form,
  onSubmit,
  isSubmitting,
  onCancel,
  submitButtonText = "Save",
}: TagFormProps) => {
  const submit = async (values: z.infer<typeof tagForm>) => {
    onSubmit(values).then((success) => {
      if (success) {
        form.reset();
      }
    });
  };

  const cancel = () => {
    form.reset();
    onCancel();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="flex flex-col h-fit gap-2"
      >
        <FormField
          control={form.control}
          name="tagName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Movie" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="coverPath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover</FormLabel>
              <FormControl>
                <div
                  className={cn(
                    "border flex py-2 px-4 rounded-md items-center w-full justify-start",
                    field.value ? "text-lime-400" : "",
                  )}
                  onClick={async () => {
                    const selected = await open({
                      title: "Select Cover",
                      filters: [
                        { name: "Image", extensions: ["png", "jpeg", "jpg"] },
                      ],
                    });
                    if (selected) {
                      field.onChange(selected);
                    }
                  }}
                >
                  <UploadIcon className="w-4 h-4 mr-2" />
                  {field.value ? "Change Cover" : "Upload Cover"}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Detailed description here..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="w-full flex justify-between mt-4">
          <Button type="button" variant="secondary" onClick={cancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Loaders.circular loading={isSubmitting} className="mr-2" />
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
};
