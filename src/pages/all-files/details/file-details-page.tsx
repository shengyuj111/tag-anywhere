import {
  getFileDisplayType,
  UpdateFileRequest,
  useGetFileByIdQuery,
  useUpdateFileMutation,
} from "@/api/api/file-api";

import { Loaders } from "@/components/ui/loaders";
import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ImageDetails } from "./image-details";
import { VideoDetails } from "./video-details";
import { AudioDetails } from "./audio-details";
import { ManageDetails } from "./manga-details";
import { TVSeriesDetails } from "./tv-series-details";
import { toast } from "@/components/ui/use-toast";

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

  const [updateFile] = useUpdateFileMutation();

  const updateFileName = async (name: string) => {
    try {
      await updateFile({
        id: mainFile?.id,
        name: name,
        path: mainFile?.path,
        type: mainFile?.type,
        rsa: mainFile?.rsa,
        description: mainFile?.description,
        coverPath: mainFile?.coverPath,
      } as UpdateFileRequest);
      toast({
        title: "File name updated",
        description: "File name has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to update name",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {isFetchingFile && <Loaders.circular size="large" layout="area" />}
      {fileDisplayType === "Audio" && (
        <AudioDetails fileData={fileData!} onUpdateName={updateFileName} />
      )}
      {fileDisplayType === "Image" && (
        <ImageDetails fileData={fileData!} onUpdateName={updateFileName} />
      )}
      {fileDisplayType === "Video" && (
        <VideoDetails fileData={fileData!} onUpdateName={updateFileName} />
      )}
      {fileDisplayType === "Manga" && (
        <ManageDetails fileData={fileData!} onUpdateName={updateFileName} />
      )}
      {fileDisplayType === "TV Series" && (
        <TVSeriesDetails fileData={fileData!} onUpdateName={updateFileName} />
      )}
    </>
  );
};
