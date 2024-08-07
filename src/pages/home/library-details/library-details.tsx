import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { FilesSection } from "@/components/composition/files-section";
import { FileCoverAspectRatio } from "@/lib/file-enum";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GetLibraryByIdRequest, UpdateLibraryRequest, useGetLibraryByIdQuery, useUpdateLibraryMutation } from "@/api/api/library-api";
import { BackableHeader } from "@/components/composition/backable-header";
import { useGetAllTagsQuery } from "@/api/api/tag-api";
import { LibraryForm } from "@/pages/create/library-form";
import { libraryForm } from "@/pages/create/forms";
import { toast } from "@/components/ui/use-toast";

export const LibraryDetailsPage = () => {
  const [ignoreChildren, setIgnoreChildren] = useState(true);
  const { libraryId } = useParams();
  const [updateLibrary, { isLoading: isUpdatingLibrary }] = useUpdateLibraryMutation();
  const { data: library } = useGetLibraryByIdQuery(
    !libraryId ? skipToken : { libraryId: Number(libraryId) } as GetLibraryByIdRequest,
  );
  const { data: tagsResponse } = useGetAllTagsQuery({});
  const tags = useMemo(() => tagsResponse?.tags ?? [], [tagsResponse?.tags]);
  const includeTags = useMemo(() => library?.includeTagIds?.map((tagId) => tags.find((tag) => tag.id === tagId)).filter((tag) => tag !== undefined) ?? [], [library, tags]);
  const excludeTags = useMemo(() => library?.excludeTagIds?.map((tagId) => tags.find((tag) => tag.id === tagId)).filter((tag) => tag !== undefined) ?? [], [library, tags]);

  const form = useForm<z.infer<typeof libraryForm>>({
    resolver: zodResolver(libraryForm),
    defaultValues: {
      name: "",
      coverPath: "",
      includeInName: "",
      includeTags: [],
      excludeTags: [],
    },
  });

  console.log(library);

  useEffect(() => {
    if (library && includeTags && excludeTags) {
      console.log(library);
      form.reset({
        name: library.name || "",
        coverPath: library.coverPath || "",
        includeInName: library.includeInName || "",
        includeTags: includeTags.map(tag => ({ label: tag.name, value: tag.id.toString() })),
        excludeTags: excludeTags.map(tag => ({ label: tag.name, value: tag.id.toString() })),
      });
    }
  }, [library, includeTags, excludeTags, form]);

  const onSubmit = async (values: z.infer<typeof libraryForm>) => {
    try {
      await updateLibrary({
        id: library?.id,
        name: values.name,
        includeInName: values.includeInName === "" ? null : values.includeInName,
        coverPath: values.coverPath,
        includeTagIds: values.includeTags?.map(tag => Number(tag.value)) ?? [],
        excludeTagIds: values.excludeTags?.map(tag => Number(tag.value)) ?? [],
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

  return (
    <>
      <div className="w-full h-full flex justify-center">
        <div className="w-[80%] h-full flex flex-col items-center gap-4 ">
          <BackableHeader title="Library Details" />
          <div className="flex gap-4 w-full flex-grow">
            <Card className="w-[20%] h-full p-6">
              <LibraryForm
                form={form}
                onSubmit={onSubmit}
                isSubmitting={isUpdatingLibrary}
                onCancel={() => {}}
                submitButtonText="Update Library"
              />
            </Card>
            <Card className="w-full h-full p-6 flex flex-col gap-8">
              <div className="w-full flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch checked={ignoreChildren} onCheckedChange={setIgnoreChildren} />
                  <Label>Ignore Subfile</Label>
                </div>
                <div className="flex-1" />
              </div>
              <div className="w-full flex-1">
                <FilesSection
                  fileCoverAspectRatio={FileCoverAspectRatio.Book}
                  includeInName={form.getValues().includeInName}
                  ignoreChildren={ignoreChildren}
                  includeTagIds={(form.getValues().includeTags || []).map(tag => Number(tag.value))}
                  excludeTagIds={(form.getValues().excludeTags || []).map(tag => Number(tag.value))}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};
