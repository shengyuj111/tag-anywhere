import {
  useCreateLibraryMutation,
  CreateLibraryRequest,
  useUpdateLibraryMutation,
  useGetLibraryByIdQuery,
  GetLibraryByIdRequest,
  UpdateLibraryRequest,
} from "@/api/api/library-api";
import { useGetAllTagsQuery } from "@/api/api/tag-api";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const OptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const libraryForm = z.object({
  libraryName: z.string().min(2).max(50),
  coverPath: z.string().min(1),
  includeInName: z.string().optional(),
  includeTags: z.array(OptionSchema).optional(),
  excludeTags: z.array(OptionSchema).optional(),
});

export const useCreateLibraryForm = () => {
  const [createLibrary, { isLoading: isCreatingLibrary }] =
    useCreateLibraryMutation();

  const form = useForm<z.infer<typeof libraryForm>>({
    resolver: zodResolver(libraryForm),
    defaultValues: {
      libraryName: "",
      coverPath: "",
      includeInName: "",
      includeTags: [],
      excludeTags: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof libraryForm>) => {
    try {
      await createLibrary({
        name: values.libraryName,
        includeInName:
          values.includeInName === "" ? null : values.includeInName,
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
      return true;
    } catch (error) {
      toast({
        title: "Failed to create library",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    }
  };

  return { form, onSubmit, isCreatingLibrary };
};

export const useUpdateLibraryForm = (libraryId: string) => {
  const { data: library } = useGetLibraryByIdQuery(
    !libraryId
      ? skipToken
      : ({ libraryId: Number(libraryId) } as GetLibraryByIdRequest),
  );
  const [updateLibrary, { isLoading: isUpdatingLibrary }] =
    useUpdateLibraryMutation();
  const { data: tagsResponse } = useGetAllTagsQuery({});
  const tags = useMemo(() => tagsResponse?.tags ?? [], [tagsResponse?.tags]);
  const includeTags = useMemo(
    () =>
      library?.includeTagIds
        ?.map((tagId) => tags.find((tag) => tag.id === tagId))
        .filter((tag) => tag !== undefined) ?? [],
    [library, tags],
  );
  const excludeTags = useMemo(
    () =>
      library?.excludeTagIds
        ?.map((tagId) => tags.find((tag) => tag.id === tagId))
        .filter((tag) => tag !== undefined) ?? [],
    [library, tags],
  );

  const form = useForm<z.infer<typeof libraryForm>>({
    resolver: zodResolver(libraryForm),
    defaultValues: {
      libraryName: "",
      coverPath: "",
      includeInName: "",
      includeTags: [],
      excludeTags: [],
    },
  });

  useEffect(() => {
    if (library && includeTags && excludeTags) {
      form.reset({
        libraryName: library.name || "",
        coverPath: library.coverPath || "",
        includeInName: library.includeInName || "",
        includeTags: includeTags.map((tag) => ({
          label: tag.name,
          value: tag.id.toString(),
        })),
        excludeTags: excludeTags.map((tag) => ({
          label: tag.name,
          value: tag.id.toString(),
        })),
      });
    }
  }, [library, includeTags, excludeTags, form]);

  const onSubmit = async (values: z.infer<typeof libraryForm>) => {
    try {
      await updateLibrary({
        id: library?.id,
        name: values.libraryName,
        includeInName:
          values.includeInName === "" ? null : values.includeInName,
        coverPath: values.coverPath,
        includeTagIds:
          values.includeTags?.map((tag) => Number(tag.value)) ?? [],
        excludeTagIds:
          values.excludeTags?.map((tag) => Number(tag.value)) ?? [],
        includeFileIds: [],
        excludeFileIds: [],
      } as UpdateLibraryRequest);
      toast({
        title: "Library Updated",
        description: "Library has been updated",
      });
      return true;
    } catch (error) {
      toast({
        title: "Failed to update library",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    }
  };

  return { form, onSubmit, isUpdatingLibrary };
};
