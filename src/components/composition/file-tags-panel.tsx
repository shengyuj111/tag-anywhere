import {
  FileCommon,
  UpdateTagsRequest,
  useUpdateTagsToFilesMutation,
} from "@/api/api/file-api";
import { CardDescription, CardHeader, CardTitle } from "../ui/card";
import { EditIcon, SaveIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Visibility } from "../ui/visibility";
import { useMemo, useState } from "react";
import { useGetAllTagsQuery } from "@/api/api/tag-api";
import MultipleSelector from "../ui/multi-selector";
import { Separator } from "../ui/separator";
import { TagBadge } from "./tag-badge";
import { TagContext } from "./tag-context";

interface FileDetailProps {
  mainFile: FileCommon;
}

export const FileTagsPanel = ({ mainFile }: FileDetailProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: tagsResponse } = useGetAllTagsQuery({});
  const tags = useMemo(() => tagsResponse?.tags ?? [], [tagsResponse?.tags]);
  const tagOptions = useMemo(() => {

    const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));
    return sortedTags.map((tag) => ({
      label: tag.name,
      value: tag.id.toString(),
    }));
  }, [tags]);
  const [updatedTags, setUpdatedTags] = useState<
    { label: string; value: string }[]
  >([]);
  const [updateTagsToFiles, { isLoading: isUpdating }] =
    useUpdateTagsToFilesMutation();

  const handleSaveChanges = async () => {
    await updateTagsToFiles({
      fileIds: [mainFile.id],
      tagIds: updatedTags.map((tag) => Number(tag.value)),
    } as UpdateTagsRequest);
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setUpdatedTags(
      mainFile.tagIds.map((tagId) => {
        const tag = tags.find((tag) => tag.id === tagId);
        return { label: tag?.name ?? "", value: tag?.id.toString() ?? "" };
      }),
    );
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setUpdatedTags([]);
    setIsEditing(false);
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-col p-6 gap-4 h-full">
        <CardHeader className="flex-row items-center p-0">
          <div className="grid gap-2">
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Info Pieces that are used to categorize the file
            </CardDescription>
          </div>
          <Visibility isVisible={!isEditing}>
            <Button
              size="sm"
              className="ml-auto gap-1"
              onClick={handleStartEditing}
            >
              Edit
              <EditIcon className="h-4 w-4" />
            </Button>
          </Visibility>
          <Visibility isVisible={isEditing}>
            <Button
              variant="secondary"
              size="sm"
              className="ml-auto gap-1"
              disabled={isUpdating}
              onClick={handleCancelEditing}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="ml-2 gap-1"
              onClick={handleSaveChanges}
              disabled={isUpdating}
            >
              Save Changes
              <SaveIcon className="h-4 w-4" />
            </Button>
          </Visibility>
        </CardHeader>
        <Separator className="w-full" />
        <div className="w-full h-[70%] flex-grow">
          <Visibility isVisible={!isEditing}>
            <div className="flex w-full flex-wrap items-start justify-start gap-1">
              {mainFile.tagIds.map((tagId) => (
                <TagBadge key={tagId} tagId={tagId} />
              ))}
            </div>
          </Visibility>
          <Visibility isVisible={isEditing}>
            <MultipleSelector
              badgeWrapper={TagContext}
              value={updatedTags}
              defaultOptions={tagOptions}
              onChange={(selected) => setUpdatedTags(selected)}
            />
          </Visibility>
        </div>
      </div>
    </div>
  );
};
