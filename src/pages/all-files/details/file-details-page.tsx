import { getFileDisplayType, useGetFileByIdQuery } from "@/api/api/file-api";

import { Loaders } from "@/components/ui/loaders";
import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ImageDetails } from "./image-details";
import { VideoDetails } from "./video-details";
import { AudioDetails } from "./audio-details";
import { ManageDetails } from "./manga-details";
import { TVSeriesDetails } from "./tv-series-details";

export const FileDetailsPage = () => {
  const { fileId } = useParams();
  const { data: fileData, isFetching: isFetchingFile } = useGetFileByIdQuery(
    !fileId ? skipToken : { fileId: Number(fileId) },
  );

  const mainFile = useMemo(() => fileData?.file, [fileData]);
  const fileDisplayType = useMemo(
    () => (mainFile ? getFileDisplayType(mainFile) : undefined),
    [mainFile],
  );

  return (
    <>
      {isFetchingFile && <Loaders.circular size="large" layout="area" />}
      {fileDisplayType === "Audio" && <AudioDetails fileData={fileData!} />}
      {fileDisplayType === "Image" && <ImageDetails fileData={fileData!} />}
      {fileDisplayType === "Video" && <VideoDetails fileData={fileData!} />}
      {fileDisplayType === "Manga" && <ManageDetails fileData={fileData!} />}
      {fileDisplayType === "TV Series" && (
        <TVSeriesDetails fileData={fileData!} />
      )}
    </>
  );
};
