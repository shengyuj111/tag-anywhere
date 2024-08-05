import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H2, P } from "@/components/ui/typography";
import {
  LibraryIcon,
  NotebookTabsIcon,
  TagIcon,
  UploadIcon,
} from "lucide-react";
import { createBookForm, createLibraryForm, createTagForm } from "./forms";
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
import {
  TagCommon,
  tagTypes,
  useCreateTagMutation,
  useGetAllTagsQuery,
} from "@/api/api/tag-api";
import { capitalize } from "lodash";
import { Textarea } from "@/components/ui/textarea";
import { open } from "@tauri-apps/api/dialog";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { DataProvider } from "@/components/provider/data-provider/data-provider";
import { useData } from "@/components/provider/data-provider/data-context";
import { toast, useToast } from "@/components/ui/use-toast";
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
import MultipleSelector from "@/components/ui/multi-selector";
import { TagContext } from "@/components/composition/tag-context";
import {
  CreateLibraryRequest,
  useCreateLibraryMutation,
} from "@/api/api/library-api";
import { FilesSection } from "@/components/composition/files-section";
import { FileCoverAspectRatio } from "@/lib/file-enum";

type CreatePageData = {
  previewTag: TagCommon | null;
  setPreviewTag: (tag: TagCommon) => void;
  createLibrary: CreateLibraryRequest | null;
  setCreateLibrary: (library: CreateLibraryRequest) => void;
};

export const CreatePage = () => {
  const [previewTag, setPreviewTag] = useState<TagCommon | null>(null);
  const [createLibrary, setCreateLibrary] =
    useState<CreateLibraryRequest | null>(null);

  return (
    <DataProvider
      data={
        {
          previewTag,
          setPreviewTag,
          createLibrary,
          setCreateLibrary,
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
          <TabsContent value="library">
            <LibraryPreview />
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

  const onSubmit = async (values: z.infer<typeof createBookForm>) => {
    try {
      await createCompoundFile({
        ...values,
      } as CreateCompositeFileRequest);
      toast({
        title: "Book Created",
        description: "Book has been created",
      });
    } catch (error) {
      toast({
        title: "Failed to create book",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
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
  const { setCreateLibrary } = useData<CreatePageData>("CreatePage");
  const { data: tagsResponse } = useGetAllTagsQuery({});
  const [createLibrary, { isLoading }] = useCreateLibraryMutation();
  const tags = useMemo(() => tagsResponse ?? [], [tagsResponse]);
  const form = useForm<z.infer<typeof createLibraryForm>>({
    resolver: zodResolver(createLibraryForm),
    defaultValues: {
      name: "",
      coverPath: "",
      nameRegex: "",
      includeTags: [],
      excludeTags: [],
    },
  });

  const preview = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      const values = form.getValues();
      setCreateLibrary({
        name: values.name,
        nameRegx: values.nameRegex === "" ? null : values.nameRegex,
        coverPath: values.coverPath,
        includeTagIds:
          values.includeTags?.map((tag) => Number(tag.value)) ?? [],
        excludeTagIds:
          values.excludeTags?.map((tag) => Number(tag.value)) ?? [],
        includeFileIds: [],
        excludeFileIds: [],
      } as CreateLibraryRequest);
    } else {
      toast({
        variant: "destructive",
        description: "Please fill out the form correctly before previewing.",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof createLibraryForm>) => {
    try {
      await createLibrary({
        name: values.name,
        nameRegx: values.nameRegex === "" ? null : values.nameRegex,
        coverPath: values.coverPath,
        includeTagIds:
          values.includeTags?.map((tag) => Number(tag.value)) ?? [],
        excludeTagIds:
          values.excludeTags?.map((tag) => Number(tag.value)) ?? [],
        includeFileIds: [],
        excludeFileIds: [],
      } as CreateLibraryRequest);
      toast({
        title: "Library Created",
        description: "Library has been created",
      });
    } catch (error) {
      toast({
        title: "Failed to create library",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
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
          name="nameRegex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name Regex</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'"
                  {...field}
                />
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
    try {
      createTag({
        ...values,
        color: null,
      });
      toast({
        title: "Tag Created",
        description: "Tag has been created",
      });
    } catch (error) {
      toast({
        title: "Failed to create tag",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
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

const LibraryPreview = () => {
  const { createLibrary } = useData<CreatePageData>("CreatePage");

  return (
    createLibrary && (
      <FilesSection
        fileCoverAspectRatio={FileCoverAspectRatio.Book}
        includeTagIds={createLibrary?.includeTagIds ?? []}
        excludeTagIds={createLibrary?.excludeTagIds ?? []}
        includeFileIds={createLibrary?.includeFileIds ?? []}
        excludeFileIds={createLibrary?.excludeFileIds ?? []}
      />
    )
  );
};

const TabsField = () => {
  return (
    <div>
      <P className="mb-2">Mode</P>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="library">
          <LibraryIcon className="w-4 h-4 mr-2" />
          Library
        </TabsTrigger>
        <TabsTrigger value="book">
          <NotebookTabsIcon className="w-4 h-4 mr-2" />
          Book
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
