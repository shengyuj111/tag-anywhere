import { useGetAllTagsQuery } from "@/api/api/tag-api";
import { libraryForm } from "./forms";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TagContext } from "@/components/composition/tag-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loaders } from "@/components/ui/loaders";
import { cn } from "@/lib/utils";
import { UploadIcon } from "lucide-react";
import { open } from "@tauri-apps/api/dialog";
import MultipleSelector from "@/components/ui/multi-selector";
import { Visibility } from "@/components/ui/visibility";

interface LibraryFormProps {
  form: ReturnType<typeof useForm<z.infer<typeof libraryForm>>>;
  onSubmit: (values: z.infer<typeof libraryForm>) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export const LibraryForm = ({
  form,
  onSubmit,
  isSubmitting,
  onCancel,
  submitButtonText = "Save",
}: LibraryFormProps) => {
  const { data: tagsResponse } = useGetAllTagsQuery({});
  const tags = useMemo(() => tagsResponse?.tags ?? [], [tagsResponse?.tags]);
  const submit = async (values: z.infer<typeof libraryForm>) => {
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
        className="flex flex-col h-full gap-2"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Library Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Collection of aaa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="includeInName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name Contains</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 480p" {...field} />
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
        <Visibility isVisible={tags.length > 0}>
          <FormField
            control={form.control}
            name="includeTags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Include Tags</FormLabel>
                <FormControl>
                  <MultipleSelector
                    badgeWrapper={TagContext}
                    value={field.value ?? []}
                    defaultOptions={tags.map((tag) => ({
                      label: tag.name,
                      value: tag.id.toString(),
                    }))}
                    onChange={(selected) => field.onChange(selected)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Visibility>
        <Visibility isVisible={tags.length > 0}>
          <FormField
            control={form.control}
            name="excludeTags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exclude Files</FormLabel>
                <FormControl>
                  <MultipleSelector
                    badgeWrapper={TagContext}
                    value={field.value ?? []}
                    defaultOptions={tags.map((tag) => ({
                      label: tag.name,
                      value: tag.id.toString(),
                    }))}
                    onChange={(selected) => field.onChange(selected)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Visibility>
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
