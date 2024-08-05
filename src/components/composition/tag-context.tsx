import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Option } from "@/components/ui/multi-selector";
import { pathToUrl } from "@/api/api/helper";
import { ScrollArea } from "../ui/scroll-area";
import { Large, Small } from "../ui/typography";
import { useGetTagByIdQuery } from "@/api/api/tag-api";
import Image from "../ui/image";

export const TagContext = ({
  option,
  children,
}: {
  option: Option;
  children: ReactNode;
}) => {
  const tagId = Number(option.value);
  const { data: tag } = useGetTagByIdQuery({ id: tagId });

  return (
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
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
              {tag?.description || "No Description"}
            </Small>
          </div>
        </ScrollArea>
      </TooltipContent>
    </Tooltip>
  );
};
