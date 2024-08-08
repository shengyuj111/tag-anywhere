import { useScanFilesMutation } from "@/api/api/file-api";
import { useStorage } from "@/components/provider/storage-provider/storage-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loaders } from "@/components/ui/loaders";
import { ArrowDownNarrowWideIcon, BookAIcon, ScanTextIcon } from "lucide-react";
import { LibraryForm } from "../create/library-form";
import {
  CreateLibraryRequest,
  useCreateLibraryMutation,
} from "@/api/api/library-api";
import { libraryForm } from "../create/forms";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";
import { FilesSection } from "@/components/composition/files-section";
import { FileCoverAspectRatio } from "@/lib/file-enum";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { H3 } from "@/components/ui/typography";
import { useContext, useState } from "react";
import { DialogContext } from "@/components/provider/dialog-provider/dialog-service-provider";
import CreateBookDialog from "./create-book-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import Combobox from "@/components/ui/combobox";

export const AllFilesPage = () => {
  const dialogManager = useContext(DialogContext).manager;
  const [createLibrary, { isLoading: isCreatingLibrary }] =
    useCreateLibraryMutation();
  const { settings } = useStorage()!;
  const [scanFiles, { isLoading: isScanning }] = useScanFilesMutation();
  const [ignoreChildren, setIgnoreChildren] = useState(true);
  const [isAscending, setIsAscending] = useState(true);
  const [column, setColumn] = useState<string | undefined>("id");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
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

  const onSubmit = async (values: z.infer<typeof libraryForm>) => {
    try {
      await createLibrary({
        name: values.name,
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

  const openCreateBookDialog = () => {
    dialogManager.openDialog({
      child: <CreateBookDialog />,
    });
  };

  return (
    <>
      <div className="w-full h-full flex justify-center">
        <div className="w-[95%] h-full flex flex-col items-center gap-4 ">
          <H3 className="w-full flex">Files Library</H3>
          <div className="flex gap-4 w-full flex-grow">
            <Card className="w-[40%] 2xl:w-[20%] h-full p-6 overflow-hidden">
              <LibraryForm
                form={form}
                onSubmit={onSubmit}
                isSubmitting={isCreatingLibrary}
                onCancel={() => {}}
                submitButtonText="Create Library"
              />
            </Card>
            <Card className="w-[calc(60%-1rem)] 2xl:w-[calc(80%-1rem)] h-full p-6 flex flex-col gap-8 overflow-hidden">
              <div className="w-full flex-1">
                <FilesSection
                  fileCoverAspectRatio={FileCoverAspectRatio.Book}
                  includeInName={form.getValues().includeInName}
                  ignoreChildren={ignoreChildren}
                  includeTagIds={(form.getValues().includeTags || []).map(
                    (tag) => Number(tag.value),
                  )}
                  excludeTagIds={(form.getValues().excludeTags || []).map(
                    (tag) => Number(tag.value),
                  )}
                  includeType={typeFilter}
                  sortOn={column}
                  isAscending={isAscending}
                >
                  <div className="w-full flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={ignoreChildren}
                        onCheckedChange={setIgnoreChildren}
                      />
                      <Label>Ignore Subfile</Label>
                    </div>
                    <div className="flex-1" />
                    <Button
                      disabled={isScanning || !settings}
                      onClick={openCreateBookDialog}
                    >
                      <BookAIcon className="w-4 h-4 mr-2" />
                      Create Book
                    </Button>
                    <Button
                      disabled={isScanning || !settings}
                      onClick={() => {
                        scanFiles({});
                      }}
                    >
                      <Loaders.circular size="small" loading={isScanning} />
                      <ScanTextIcon className="w-4 h-4 mr-2" />
                      Scan
                    </Button>
                  </div>
                  <div className="w-full flex justify-end items-center gap-4 mb-6">
                    <Combobox
                      className="w-fit"
                      datas={[
                        { value: "Video", label: "Video" },
                        { value: "Image", label: "Image" },
                        { value: "Audio", label: "Audio" },
                        { value: "Composition_Manga", label: "Mange" },
                        { value: "Composition_TvSeries", label: "TV Series" },
                      ]}
                      selectHint="All"
                      searchHint="Filter File Type By..."
                      noResultsHint="No Results"
                      value={typeFilter}
                      onChange={setTypeFilter}
                    />
                    <Combobox
                      className="w-fit"
                      datas={[
                        { value: "id", label: "Created At" },
                        { value: "name", label: "Name" },
                        { value: "numOfTags", label: "# Tags" },
                      ]}
                      selectHint="All"
                      searchHint="Sort File By..."
                      noResultsHint="No Results"
                      canUnselect={false}
                      value={column}
                      onChange={setColumn}
                    />
                    <Toggle
                      variant="outline"
                      size="sm"
                      pressed={isAscending}
                      onPressedChange={setIsAscending}
                    >
                      <ArrowDownNarrowWideIcon />
                    </Toggle>
                  </div>
                </FilesSection>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};
