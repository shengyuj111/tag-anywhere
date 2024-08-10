import { z } from "zod";
import { useForm } from "react-hook-form";

import { UploadIcon } from "lucide-react";
import { open } from "@tauri-apps/api/dialog";
import { cn } from "@/lib/utils";
import { bookForm } from "./forms";
import { fileTypeMap, fileTypes } from "@/api/api/file-api";
import { useStorage } from "@/components/provider/storage-provider/storage-provider";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loaders } from "@/components/ui/loaders";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BookFormProps {
  form: ReturnType<typeof useForm<z.infer<typeof bookForm>>>;
  onSubmit: (values: z.infer<typeof bookForm>) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export const BookForm = ({
  form,
  onSubmit,
  onCancel,
  isSubmitting,
  submitButtonText = "Save",
}: BookFormProps) => {
  const { settings } = useStorage()!;
  const getExtensionForBook = (type: string) => {
    if (type === "Composition_Manga") {
      return ["png", "jpeg", "jpg"];
    } else if (type === "Composition_TvSeries") {
      return ["mp4", "mkv", "avi", "webm", "mov", "flv", "wmv"];
    }
    return [];
  };

  const submit = async (values: z.infer<typeof bookForm>) => {
    const success = await onSubmit(values);
    if (success) {
      form.reset();
    }
  };

  const cancel = () => {
    form.reset();
    onCancel();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="flex flex-col h-full gap-2"
      >
        <FormField
          control={form.control}
          name="bookName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Book Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Rick & Morty Season 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fileTypes
                    .filter((t) => t.startsWith("Composition_"))
                    .map((type) => (
                      <SelectItem key={type} value={type}>
                        {fileTypeMap[type].label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                    // Open file picker
                    const selected = await open({
                      title: "Select Cover",
                      filters: [
                        {
                          name: "Image",
                          extensions: ["png", "jpeg", "jpg"],
                        },
                      ],
                    });
                    if (Array.isArray(selected)) {
                      // user selected multiple files
                    } else if (selected === null) {
                      // user cancelled the selection
                    } else {
                      // user selected a single file
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
          name="childFilePaths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Files</FormLabel>
              <FormControl>
                <div
                  className={cn(
                    "border flex py-2 px-4 rounded-md items-center w-full justify-start",
                    field.value && field.value.length > 0
                      ? "text-lime-400"
                      : "",
                  )}
                  onClick={async () => {
                    // Open file picker
                    const selected = await open({
                      title: "Select Cover",
                      multiple: true,
                      defaultPath: settings!.storehousePath!,
                      filters: [
                        {
                          name: "Image & Video",
                          extensions: getExtensionForBook(
                            form.getValues().type,
                          ),
                        },
                      ],
                    });
                    if (Array.isArray(selected)) {
                      // user selected multiple files
                      field.onChange(selected);
                    } else if (selected === null) {
                      // user cancelled the selection
                    } else {
                      // user selected a single file
                    }
                  }}
                >
                  <UploadIcon className="w-4 h-4 mr-2" />
                  {field.value && field.value.length > 0
                    ? `${field.value.length} file(s) selected`
                    : "Choose File"}
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
                  placeholder="e.g. This is a series about..."
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
