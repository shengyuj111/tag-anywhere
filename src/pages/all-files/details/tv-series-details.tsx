import { HTMLAttributes, useEffect, useMemo, useState } from "react";
import { FileDetailProps } from "./file-details-type";
import {
  useUpdateCoverMutation,
  UpdateCoverRequest,
  FileCommon,
} from "@/api/api/file-api";
import { pathToUrl } from "@/api/api/helper";
import { getVideoFrameRate } from "@/api/api/rust-api";
import { BackableHeader } from "@/components/composition/backable-header";
import { FileTagsPanel } from "@/components/composition/file-tags-panel";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import VideoPlayer from "@/components/ui/video-player";
import { formatFileName } from "@/lib/format-utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "@/components/ui/image";
import { H3, Small } from "@/components/ui/typography";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useStorage } from "@/components/provider/storage-provider/storage-provider";

export const TVSeriesDetails = ({
  fileData,
  onUpdateName,
}: FileDetailProps) => {
  const mainFile = useMemo(() => fileData?.file, [fileData]);
  const fileChildren = useMemo(() => fileData?.fileChildren, [fileData]);
  const { settings } = useStorage()!;

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const currentVideo = useMemo(
    () => fileChildren[currentVideoIndex],
    [currentVideoIndex, fileChildren],
  );
  const video_path = useMemo(() => currentVideo.path, [currentVideo]);
  const [videoFrameRate, setVideoFrameRate] = useState<number | undefined>(
    undefined,
  );
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [updateFileCover] = useUpdateCoverMutation();

  useEffect(() => {
    getVideoFrameRate(video_path).then((frameRate) => {
      setVideoFrameRate(frameRate);
    });
  }, [video_path]);

  const setCurrentFrameAsCover = async () => {
    await updateFileCover({
      time: videoCurrentTime,
      id: currentVideo.id,
      filePath: currentVideo.path,
      coverPath: currentVideo.coverPath,
    } as UpdateCoverRequest);
    toast({
      title: "Cover Updated",
      description: "The current frame has been set",
    });
  };

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-[80%] flex flex-col items-center gap-4 ">
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
                  src={pathToUrl(currentVideo.path)!}
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
              <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Cover</AccordionTrigger>
                    <AccordionContent>
                      <div className="w-full flex items-center justify-center overflow-hidden rounded-md">
                        <Image
                          src={pathToUrl(mainFile.coverPath)}
                          variant="static"
                          alt="Image"
                          className="object-contain"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <H3 className="mb-4">Episodes</H3>
                {fileChildren.map((video, index) => (
                  <EpisodeButton
                    key={video.id}
                    video={video}
                    selected={currentVideoIndex === index}
                    episodeIndex={index}
                    onClick={() => setCurrentVideoIndex(index)}
                  />
                ))}
              </div>
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

interface EpisodeButtonProps extends HTMLAttributes<HTMLDivElement> {
  video: FileCommon;
  episodeIndex: number;
  selected: boolean;
}

const EpisodeButton = ({
  video,
  episodeIndex,
  selected,
  ...props
}: EpisodeButtonProps) => {
  return (
    <div
      className={cn(
        "w-full flex justify-start items-center gap-4 px-4 bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm font-medium",
        selected ? "bg-muted" : "",
      )}
      {...props}
    >
      <div className="w-[50px] h-[50px]">
        <Image
          src={pathToUrl(video.coverPath)}
          variant="static"
          alt="Image"
          className="object-contain w-full h-full rounded-none"
        />
      </div>
      <Small className="truncate">Episode {episodeIndex + 1}: </Small>
      <Small className="truncate text-muted-foreground">{video.name}</Small>
    </div>
  );
};
