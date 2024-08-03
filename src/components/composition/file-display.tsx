import { FileCoverAspectRatio } from "@/lib/file-enum";
import { AspectRatio } from "../ui/aspect-ratio";
import { Badge } from "../ui/badge";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { H4 } from "../ui/typography";
import { TagBadge } from "./tag-badge";
import { FileCommon } from "@/api/api/file-api";
import { useNavigate } from "react-router-dom";
import Image from "../ui/image";
import { pathToUrl } from "@/api/api/helper";

interface FileDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  fileCommon: FileCommon;
  fileCoverAspectRatio?: FileCoverAspectRatio;
}

export const FileDisplay = ({
  fileCommon,
  fileCoverAspectRatio = FileCoverAspectRatio.Book,
}: FileDisplayProps) => {
  const navigate = useNavigate();
  const navigateToDetails = () => {
    navigate(`/all-files/details/${fileCommon.id}`);
  };

  return (
    <div className="space-y-3 w-[250px]">
      <div className=" w-[250px] relative">
        <AspectRatio
          ratio={fileCoverAspectRatio}
          className="bg-muted overflow-hidden rounded-md cursor-pointer"
          onClick={navigateToDetails}
        >
          <Image src={pathToUrl(fileCommon.coverPath)} alt="Image" />
        </AspectRatio>
        <div className="absolute top-2 right-2">
          <Badge className="bg-blue-600 text-white">{fileCommon.type}</Badge>
        </div>
      </div>
      <div>
        <H4 className="truncate">{fileCommon.name}</H4>
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex w-max space-x-1 py-2">
            {fileCommon.tags.map((tagName) => (
              <TagBadge key={tagName} tagName={tagName} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};
