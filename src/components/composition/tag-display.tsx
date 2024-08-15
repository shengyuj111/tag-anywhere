import { FileCoverAspectRatio } from "@/lib/file-enum";
import { AspectRatio } from "../ui/aspect-ratio";
import { H4, Small } from "../ui/typography";
import {
  TagCommon,
  useGetTagFileNumberQuery,
} from "@/api/api/tag-api";
import Image from "../ui/image";
import { useNavigate } from "react-router-dom";
import { pathToUrl } from "@/api/api/helper";
import { useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";

interface TagDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  tagCommon: TagCommon;
  numOfFiles?: number;
}

export const TagDisplay = ({ tagCommon, numOfFiles }: TagDisplayProps) => {
  const { data: numOfFilesResponse } = useGetTagFileNumberQuery(
    numOfFiles ? skipToken : { id: tagCommon.id },
  );
  const fileNumber = useMemo(
    () =>
      numOfFiles
        ? numOfFiles
        : numOfFilesResponse
          ? numOfFilesResponse!.numOfFiles
          : 0,
    [numOfFiles, numOfFilesResponse],
  );
  const navigate = useNavigate();
  const navigateToDetails = () => {
    if (numOfFiles) return;
    navigate(`/tags/details/${tagCommon.id}`);
  };

  return (
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
  );
};
