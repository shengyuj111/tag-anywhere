import {
  FileCommon,
  useDeleteFileMutation,
  useScanFilesMutation,
} from "@/api/api/file-api";
import { useStorage } from "@/components/provider/storage-provider/storage-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loaders } from "@/components/ui/loaders";
import { ArrowDownNarrowWideIcon, BookAIcon, ScanTextIcon } from "lucide-react";
import { LibraryForm } from "../create/library-form/library-form";
import { FilesSection } from "@/components/composition/files-section";
import { FileCoverAspectRatio } from "@/lib/file-enum";
import { H3 } from "@/components/ui/typography";
import { ReactNode, useContext, useState } from "react";
import { DialogContext } from "@/components/provider/dialog-provider/dialog-service-provider";
import CreateBookDialog from "./create-book-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import Combobox from "@/components/ui/combobox";
import { useCreateLibraryForm } from "../create/library-form/form";
import { useSectionHook } from "@/components/composition/section-hook";
import { copyToClipboard } from "@/lib/system-utils";
import { toast } from "@/components/ui/use-toast";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export const AllFilesPage = () => {
  const dialogManager = useContext(DialogContext).manager;
  const { form, onSubmit, isCreatingLibrary } = useCreateLibraryForm();
  const { settings } = useStorage()!;
  const [scanFiles, { isLoading: isScanning }] = useScanFilesMutation();
  const [ignoreChildren, setIgnoreChildren] = useState(true);
  const {
    typeFilter,
    handleSetTypeFilter,
    column,
    handleSetColumn,
    isAscending,
    handleSetIsAscending,
    ...sectionProps
  } = useSectionHook("files-management");

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
                  contextMenuWrapper={FileContext}
                  {...sectionProps}
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
                      onChange={handleSetTypeFilter}
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
                      onChange={handleSetColumn}
                    />
                    <Toggle
                      variant="outline"
                      size="sm"
                      pressed={isAscending}
                      onPressedChange={handleSetIsAscending}
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

const FileContext = ({
  children,
  fileCommon,
}: {
  children: ReactNode;
  fileCommon: FileCommon;
}) => {
  const [deleteFile] = useDeleteFileMutation();

  const copyFilePath = () => {
    if (!fileCommon) return;
    copyToClipboard(fileCommon.path ?? "", (success: boolean) => {
      if (success) {
        toast({
          description: "The path has been copied",
        });
      } else {
        toast({
          variant: "destructive",
          description: "The path could not be copied",
        });
      }
    });
  };

  const handleDeleteFile = async () => {
    if (!fileCommon) return;
    await deleteFile({ id: fileCommon.id });
    toast({
      title: "Tag Deleted",
      description: "The tag has been deleted",
    });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger disabled={!fileCommon}>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem inset onClick={copyFilePath}>
          Copy File Path
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive"
          inset
          onClick={handleDeleteFile}
        >
          Delete File
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
