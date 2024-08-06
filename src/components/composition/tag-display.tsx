import { FileCoverAspectRatio } from "@/lib/file-enum";
import { AspectRatio } from "../ui/aspect-ratio";
import { H4, Small } from "../ui/typography";
import {
  TagCommon,
  useDeleteTagMutation,
  useGetTagByIdQuery,
} from "@/api/api/tag-api";
import { useToast } from "../ui/use-toast";
import { copyToClipboard } from "@/lib/system-utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../ui/context-menu";
import Image from "../ui/image";
import { useNavigate } from "react-router-dom";
import { pathToUrl } from "@/api/api/helper";
import { useMemo } from "react";

interface TagDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  tagCommon: TagCommon;
}

export const TagDisplay = ({ tagCommon }: TagDisplayProps) => {
  const [deleteTag] = useDeleteTagMutation();
  const { toast } = useToast();
  const { data: tagResponse } = useGetTagByIdQuery({ id: tagCommon.id });
  const fileNumber = useMemo(
    () => (tagResponse ? tagResponse!.fileIds.length : 0),
    [tagResponse],
  );
  const navigate = useNavigate();
  const navigateToDetails = () => {
    navigate(`/tags/details/${tagCommon.id}`);
  };

  const copyTagName = () => {
    copyToClipboard(tagCommon.name, (success: boolean) => {
      if (success) {
        toast({
          description: "The tag name has been copied",
        });
      } else {
        toast({
          variant: "destructive",
          description: "The tag name could not be copied",
        });
      }
    });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="space-y-3 w-[250px]">
          <div className="w-[250px] relative">
            <AspectRatio
              ratio={FileCoverAspectRatio.Book}
              className="bg-muted overflow-hidden rounded-md cursor-pointer"
              onClick={navigateToDetails}
            >
              <Image src={pathToUrl(tagCommon.coverPath)} alt="Image" />
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-2 pt-20">
                <H4 className="text-white">{tagCommon.name}</H4>
                <Small className="text-slate-400">{`${fileNumber.toLocaleString("en-US")} Files`}</Small>
              </div>
            </AspectRatio>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem inset onClick={copyTagName}>
          Copy Tag Name
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive"
          inset
          onClick={() => deleteTag({ id: tagCommon.id })}
        >
          Delete Tag
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
