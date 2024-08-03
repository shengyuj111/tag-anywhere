import { FileCommon, useUpdateTagsToFilesMutation } from "@/api/api/file-api";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { CardDescription, CardHeader, CardTitle } from "../ui/card";
import { EditIcon, SaveIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Visibility } from "../ui/visibility";
import { useMemo, useState } from "react";
import { useGetAllTagsQuery } from "@/api/api/tag-api";
import MultipleSelector from "../ui/multi-selector";
import { Separator } from "../ui/separator";
import { TagBadge } from "./tag-badge";

interface FileDetailProps {
  mainFile: FileCommon;
}

export const FileTagsPanel = ({ mainFile }: FileDetailProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: tagsResponse } = useGetAllTagsQuery({});
  const tags = useMemo(() => tagsResponse ?? [], [tagsResponse]);
  const [updatedTags, setUpdatedTags] = useState<
    { label: string; value: string }[]
  >([]);
  const [updateTagsToFiles, { isLoading: isUpdating }] =
    useUpdateTagsToFilesMutation();

  const handleSaveChanges = async () => {
    await updateTagsToFiles({
      fileIds: [mainFile.id],
      tagNames: updatedTags.map((tag) => tag.value),
    });
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setUpdatedTags(
      mainFile.tags.map((tagName) => ({ label: tagName, value: tagName })),
    );
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setUpdatedTags([]);
    setIsEditing(false);
  };

  return (
    <div className="w-full h-full">
      <ScrollArea className="flex-1">
        <div className="w-full h-full flex flex-col p-6 gap-4">
          <CardHeader className="flex flex-row items-center p-0">
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
          <div className="w-full flex-grow">
            <Visibility isVisible={!isEditing}>
              <div className="flex w-full flex-wrap items-start justify-start gap-1">
                {mainFile.tags.map((tag) => (
                  <TagBadge key={tag} tagName={tag} />
                ))}
              </div>
            </Visibility>
            <Visibility isVisible={isEditing}>
              <MultipleSelector
                value={updatedTags}
                defaultOptions={tags.map((tag) => ({
                  label: tag.name,
                  value: tag.name,
                }))}
                onChange={(selected) => setUpdatedTags(selected)}
              />
            </Visibility>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
