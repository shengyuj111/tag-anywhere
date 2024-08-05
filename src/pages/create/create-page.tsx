import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H2, P } from "@/components/ui/typography";
import {
  LibraryIcon,
  NotebookTabsIcon,
  TagIcon,
  UploadIcon,
} from "lucide-react";
import { createBookForm, createTagForm } from "./forms";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagCommon, tagTypes, useCreateTagMutation } from "@/api/api/tag-api";
import { capitalize } from "lodash";
import { Textarea } from "@/components/ui/textarea";
import { open } from "@tauri-apps/api/dialog";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { DataProvider } from "@/components/provider/data-provider/data-provider";
import { useData } from "@/components/provider/data-provider/data-context";
import { useToast } from "@/components/ui/use-toast";
import { Visibility } from "@/components/ui/visibility";
import { TagDisplay } from "@/components/composition/tag-display";
import { Loaders } from "@/components/ui/loaders";
import {
  CreateCompositeFileRequest,
  fileTypeMap,
  fileTypes,
  useCreateCompositeFileMutation,
} from "@/api/api/file-api";
import { useStorage } from "@/components/provider/storage-provider/storage-provider";

type CreatePageData = {
  previewTag: TagCommon | null;
  setPreviewTag: (tag: TagCommon) => void;
};

export const CreatePage = () => {
  const [previewTag, setPreviewTag] = useState<TagCommon | null>(null);

  return (
    <DataProvider
      data={
        {
          previewTag,
          setPreviewTag,
        } as CreatePageData
      }
      id="CreatePage"
    >
      <Tabs
        defaultValue="tag"
        className="grid h-full gap-4 md:grid-cols-[300px_1fr] md:grid-rows-[1fr]"
      >
        <TabsField />
        <div className="flex-1 bg-muted rounded-md flex items-center justify-center">
          <TabsContent value="tag">
            <TagPreview />
          </TabsContent>
        </div>
      </Tabs>
    </DataProvider>
  );
};

const BookCreateForm = () => {
  const [createCompoundFile, { isLoading }] = useCreateCompositeFileMutation();
  const { toast } = useToast();
  const { config } = useStorage()!;
  const form = useForm<z.infer<typeof createBookForm>>({
    resolver: zodResolver(createBookForm),
    defaultValues: {
      name: "",
      type: fileTypes[6],
      description: "",
      coverPath: "",
      childFilePaths: [],
    },
  });

  const preview = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      // preview logic
    } else {
      toast({
        variant: "destructive",
        description: "Please fill out the form correctly before previewing.",
      });
    }
  };

  const onSubmit = (values: z.infer<typeof createBookForm>) => {
    createCompoundFile({
      ...values,
    } as CreateCompositeFileRequest).catch((error) => {
      toast({
        variant: "destructive",
        description: error.message,
      });
    });
  };

  const getExtensionForBook = (type: string) => {
    if (type === "Composition_Manga") {
      return ["png", "jpeg", "jpg"];
    } else if (type === "Composition_TvSeries") {
      return ["mp4", "mkv", "avi", "webm", "mov", "flv", "wmv"];
    }
    return [];
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full gap-2"
      >
        <FormField
          control={form.control}
          name="name"
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
                      console.log(selected);
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
                      defaultPath: config!.storehousePath,
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
                      console.log(selected);
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
          <Button type="submit" disabled={isLoading}>
            <Loaders.circular loading={isLoading} className="mr-2" />
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={preview}>
            Preview
          </Button>
        </div>
      </form>
    </Form>
  );
};

const LibraryCreateForm = () => {
  return <div className="flex-1"></div>;
};

const TagCreateForm = () => {
  const { setPreviewTag } = useData<CreatePageData>("CreatePage");
  const [createTag, { isLoading }] = useCreateTagMutation();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof createTagForm>>({
    resolver: zodResolver(createTagForm),
    defaultValues: {
      name: "",
      type: "default",
      description: "",
    },
  });

  const preview = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setPreviewTag({
        id: -1,
        color: null,
        ...form.getValues(),
      } as TagCommon);
    } else {
      toast({
        variant: "destructive",
        description: "Please fill out the form correctly before previewing.",
      });
    }
  };

  const onSubmit = (values: z.infer<typeof createTagForm>) => {
    createTag({
      ...values,
      color: null,
    }).catch((error) => {
      toast({
        variant: "destructive",
        description: error.message,
      });
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full gap-2"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Movie" {...field} />
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
                  {tagTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {capitalize(type)}
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
                      console.log(selected);
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
                <Textarea placeholder="e.g. Movie" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="w-full flex justify-between mt-4">
          <Button type="submit" disabled={isLoading}>
            <Loaders.circular loading={isLoading} className="mr-2" />
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={preview}>
            Preview
          </Button>
        </div>
      </form>
    </Form>
  );
};

const TagPreview = () => {
  const { previewTag } = useData<CreatePageData>("CreatePage");
  return (
    <div>
      <Visibility isVisible={previewTag === null}>
        <H2 className="text-muted-foreground">Tag Preview</H2>
      </Visibility>
      <Visibility isVisible={previewTag !== null}>
        <TagDisplay tagCommon={previewTag!} />
      </Visibility>
    </div>
  );
};

const TabsField = () => {
  return (
    <div>
      <P className="mb-2">Mode</P>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="book">
          <NotebookTabsIcon className="w-4 h-4 mr-2" />
          Book
        </TabsTrigger>
        <TabsTrigger value="library">
          <LibraryIcon className="w-4 h-4 mr-2" />
          Library
        </TabsTrigger>
        <TabsTrigger value="tag">
          <TagIcon className="w-4 h-4 mr-2" />
          Tag
        </TabsTrigger>
      </TabsList>
      <TabsContent value="book" className="w-full">
        <BookCreateForm />
      </TabsContent>
      <TabsContent value="library" className="w-full">
        <LibraryCreateForm />
      </TabsContent>
      <TabsContent value="tag" className="w-full">
        <TagCreateForm />
      </TabsContent>
    </div>
  );
};
