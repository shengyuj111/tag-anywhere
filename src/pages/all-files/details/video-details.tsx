import { getVideoFrameRate } from "@/api/api/rust-api";
import { FileDetailProps } from "./file-details-type";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useUpdateCoverMutation, UpdateCoverRequest } from "@/api/api/file-api";
import { BackableHeader } from "@/components/composition/backable-header";
import { FileStatsPanel } from "@/components/composition/file-stats-panel";
import { FileTagsPanel } from "@/components/composition/file-tags-panel";
import { toast } from "@/components/ui/use-toast";
import VideoPlayer from "@/components/ui/video-player";
import { formatFileName } from "@/lib/format-utils";
import { pathToUrl } from "@/api/api/helper";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStorage } from "@/components/provider/storage-provider/storage-provider";

export const VideoDetails = ({ fileData, onUpdateName }: FileDetailProps) => {
  const mainFile = useMemo(() => fileData?.file, [fileData]);
  const video_path = useMemo(() => mainFile?.path, [mainFile?.path]);
  const [videoFrameRate, setVideoFrameRate] = useState<number | undefined>(
    undefined,
  );
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [updateFileCover] = useUpdateCoverMutation();
  const { settings } = useStorage()!;

  useEffect(() => {
    getVideoFrameRate(video_path).then((frameRate) => {
      setVideoFrameRate(frameRate);
    });
  }, [video_path]);

  const setCurrentFrameAsCover = async () => {
    await updateFileCover({
      time: videoCurrentTime,
      id: mainFile.id,
      filePath: mainFile.path,
      coverPath: mainFile.coverPath,
    } as UpdateCoverRequest);
    toast({
      title: "Cover Updated",
      description: "The current frame has been set",
    });
  };

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-[80%] h-full flex flex-col items-center gap-4 ">
        <BackableHeader
          title={formatFileName(mainFile?.name)}
          onEditSubmit={onUpdateName}
        />
        <div className="w-full h-[calc(100%-56px)] gap-4 grid grid-cols-[70%_1fr] grid-rows-[72%_1fr]">
          <Card className="p-1">
            <ContextMenu>
              <ContextMenuTrigger>
                <VideoPlayer
                  initialVolume={settings!.volume}
                  src={pathToUrl(mainFile?.path)!}
                  frameRate={videoFrameRate}
                  className="rounded-md"
                  onSetTime={setVideoCurrentTime}
                />
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={setCurrentFrameAsCover}>
                  Set As Cover
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </Card>
          <Card className="row-span-2">
            <ScrollArea className="h-full">
              <FileStatsPanel
                fileCommon={fileData.file}
                timeStamp={fileData.timeStamp}
              />
            </ScrollArea>
          </Card>
          <Card className="overflow-auto">
            <ScrollArea className="h-full">
              <FileTagsPanel mainFile={mainFile} />
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
};
