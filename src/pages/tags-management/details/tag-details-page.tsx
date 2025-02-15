import {
  UpdateTagRequest,
  useGetTagByIdQuery,
  useUpdateTagMutation,
} from "@/api/api/tag-api";
import { BackableHeader } from "@/components/composition/backable-header";
import { FilesSection } from "@/components/composition/files-section";
import { Card } from "@/components/ui/card";
import { FileCoverAspectRatio } from "@/lib/file-enum";
import { skipToken } from "@reduxjs/toolkit/query";
import { ReactNode, useMemo } from "react";
import { useParams } from "react-router-dom";
import { open } from "@tauri-apps/api/dialog";
import { useStorage } from "@/components/provider/storage-provider/storage-provider";
import { H3, Large } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { TagIcon } from "lucide-react";
import {
  FileCommon,
  RemoveTagsFromFileRequest,
  TagFileRequest,
  useRemoveTagFromFileMutation,
  useTagFilesMutation,
} from "@/api/api/file-api";
import { Visibility } from "@/components/ui/visibility";
import { Loaders } from "@/components/ui/loaders";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DataProvider } from "@/components/provider/data-provider/data-provider";
import { useData } from "@/components/provider/data-provider/data-context";
import { toast } from "@/components/ui/use-toast";
import { ImageViewer } from "@/components/composition/image-viewer";
import { pathToUrl } from "@/api/api/helper";
import { EditableText } from "@/components/composition/editable-text";
import { useSectionHook } from "@/components/composition/section-hook";

export type TagFileContextMenuData = {
  tagId: number | null;
};

export const TagDetailsPage = () => {
  const { tagId } = useParams();
  const { settings } = useStorage()!;
  const { data: tagResponse } = useGetTagByIdQuery(
    !tagId ? skipToken : { id: Number(tagId) },
  );
  const tag = useMemo(() => tagResponse?.tag, [tagResponse]);
  const [tagFiles, { isLoading }] = useTagFilesMutation();
  const [updateTag] = useUpdateTagMutation();
  const includeTagIds = useMemo(() => (tag ? [tag.id] : []), [tag]);
  const { currentPage, setCurrentPage, pageSize, setPageSize } =
    useSectionHook("tag-details");

  const addTagToFiles = async () => {
    // Open file picker
    const selected = await open({
      title: "Select files to add tag",
      multiple: true,
      defaultPath: settings!.storehousePath!,
      filters: [
        {
          name: "Image & Video",
          extensions: [
            "png",
            "jpeg",
            "jpg",
            "mp4",
            "m4v",
            "mkv",
            "webm",
            "mov",
            "flv",
            "wmv",
          ],
        },
      ],
    });
    if (Array.isArray(selected)) {
      // user selected multiple files
      await tagFiles({
        tagId: tag!.id,
        filePaths: selected,
      } as TagFileRequest);
    } else if (selected === null) {
      // user cancelled the selection
    } else {
      // user selected a single file
    }
  };

  const updateTagText = async ({
    name,
    description,
  }: {
    name?: string;
    description?: string;
  }) => {
    try {
      await updateTag({
        id: tag!.id,
        name: name,
        description: description,
      } as UpdateTagRequest);
      toast({
        title: "Tag updated",
        description: "Tag updated successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to update tag",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-[80%] h-[80%] flex flex-col items-center gap-4 ">
        <BackableHeader
          title={tag?.name}
          onEditSubmit={(value) => {
            updateTagText({ name: value });
          }}
        />
        <div className="w-full h-full gap-4 grid grid-cols-[30%_1fr] grid-rows-[30%_1fr]">
          <Card className="h-full overflow-hidden">
            <TagCoverContext tagId={tag?.id}>
              <ImageViewer src={pathToUrl(tag?.coverPath)} disableZoom />
            </TagCoverContext>
          </Card>
          <Card className="w-full h-full p-4 flex flex-col gap-4">
            <EditableText
              text={tag?.name}
              onEditSubmit={(value) => {
                updateTagText({ name: value });
              }}
              renderText={(text) => {
                return <H3>{text}</H3>;
              }}
            />
            <EditableText
              text={tag?.description}
              onEditSubmit={(value) => {
                updateTagText({ description: value });
              }}
              renderText={(text) => {
                return (
                  <Large className="text-muted-foreground">
                    {text || "No description"}
                  </Large>
                );
              }}
              useTextField
            />
          </Card>
          <Card className="col-span-2 flex flex-col gap-6 h-full p-8">
            <div className="w-full flex items-center justify-between gap-2">
              <H3>Files with Tag</H3>
              <Button
                variant="secondary"
                onClick={addTagToFiles}
                disabled={isLoading}
              >
                <Loaders.circular
                  size="small"
                  loading={isLoading}
                  className="mr-2"
                />
                <Visibility isVisible={!isLoading}>
                  <TagIcon className="w-4 h-4 mr-2" />
                </Visibility>
                Add tags to files
              </Button>
            </div>
            <DataProvider
              data={
                {
                  tagId: tag?.id || null,
                } as TagFileContextMenuData
              }
              id="tag-files-section-context-menu"
            >
              <FilesSection
                fileCoverAspectRatio={FileCoverAspectRatio.Book}
                includeTagIds={includeTagIds}
                contextMenuWrapper={TagPageFileContext}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
              />
            </DataProvider>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const TagPageFileContext = ({
  children,
  fileCommon,
}: {
  children: ReactNode;
  fileCommon: FileCommon;
}) => {
  const { tagId } = useData<TagFileContextMenuData>(
    "tag-files-section-context-menu",
  );
  const [removeTagsFromFile] = useRemoveTagFromFileMutation();
  const removeTag = async () => {
    try {
      await removeTagsFromFile({
        fileId: fileCommon.id,
        tagIds: tagId ? [tagId] : [],
      } as RemoveTagsFromFileRequest).unwrap();
      toast({
        title: "Tag removed",
        description: "Tag removed from file",
      });
    } catch (error) {
      toast({
        title: "Failed to remove tag",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={removeTag}>Remove From Tag</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export const TagCoverContext = ({
  children,
  tagId,
}: {
  tagId?: number;
  children: ReactNode;
}) => {
  const [updateTag] = useUpdateTagMutation();

  const updateTagCover = async () => {
    try {
      const selected = await open({
        title: "Select Cover",
        filters: [{ name: "Image", extensions: ["png", "jpeg", "jpg"] }],
      });
      if (Array.isArray(selected)) {
        // user selected multiple files
      } else if (selected === null) {
        // user cancelled the selection
      } else {
        // user selected a single file
        await updateTag({
          id: tagId!,
          coverPath: selected,
        } as UpdateTagRequest).unwrap();
        toast({
          title: "Cover updated",
          description: "Cover updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to update cover",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={updateTagCover}>
          Choose a new Cover
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
