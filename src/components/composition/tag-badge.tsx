import React, { useState } from "react";
import { copyToClipboard } from "@/lib/system-utils";
import { Badge } from "../ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { useToast } from "../ui/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useGetTagByIdQuery } from "@/api/api/tag-api";
import { Large, Small } from "../ui/typography";
import Image from "../ui/image";
import { ScrollArea } from "../ui/scroll-area";
import { pathToUrl } from "@/api/api/helper";

interface TagBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  tagId: number;
}

export const TagBadge = ({ tagId, ...props }: TagBadgeProps) => {
  const { toast } = useToast();
  const { data: tag } = useGetTagByIdQuery({ id: tagId });
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const copyTagName = () => {
    copyToClipboard(tag?.name || "", (success: boolean) => {
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
      <ContextMenuTrigger
        onMouseDown={(e) => {
          e.preventDefault();
        }}
      >
        <Tooltip open={tooltipVisible}>
          <TooltipTrigger
            onMouseEnter={() => {
              setTooltipVisible(true);
            }}
            onMouseLeave={() => {
              setTooltipVisible(false);
            }}
          >
            <Badge {...props} className="cursor-pointer">
              {tag?.name}
            </Badge>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="w-[400px] h-[200px] grid grid-cols-[40%_1fr] overflow-clip gap-2 p-0"
          >
            <div className="h-full overflow-hidden">
              <Image
                src={pathToUrl(tag?.coverPath)}
                alt="Image"
                className=" rounded-none"
              />
            </div>
            <ScrollArea>
              <div className="w-full h-full p-4">
                <Large>{tag?.name}</Large>
                <Small className="text-muted-foreground whitespace-normal overflow-hidden">
                  {tag?.description ||
                    "No Description"}
                </Small>
              </div>
            </ScrollArea>
          </TooltipContent>
        </Tooltip>
      </ContextMenuTrigger>
      <ContextMenuContent
        className="w-64"
        onPointerEnter={() => {
          setTooltipVisible(false);
        }}
        onPointerLeave={() => {
          setTooltipVisible(false);
        }}
      >
        <ContextMenuItem inset onClick={copyTagName}>
          Copy Tag Name
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
