import { BackableHeader } from "@/components/composition/backable-header";
import { FileStatsPanel } from "@/components/composition/file-stats-panel";
import { FileTagsPanel } from "@/components/composition/file-tags-panel";
import { Card } from "@/components/ui/card";
import { formatFileName } from "@/lib/format-utils";
import { useMemo } from "react";
import { FileDetailProps } from "./file-details-type";
import { ImageViewer } from "@/components/composition/image-viewer";
import { pathToUrl } from "@/api/api/helper";
import { ScrollArea } from "@/components/ui/scroll-area";

export const ImageDetails = ({ fileData, onUpdateName }: FileDetailProps) => {
  const mainFile = useMemo(() => fileData?.file, [fileData]);

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-[80%] flex flex-col items-center gap-4 ">
        <BackableHeader
          title={formatFileName(mainFile?.name)}
          onEditSubmit={onUpdateName}
        />
        <div className="w-full h-[calc(100%-56px)] gap-4 grid grid-cols-[70%_1fr] grid-rows-[72%_1fr]">
          <Card className="p-1">
            <ImageViewer src={pathToUrl(mainFile?.path)} />
          </Card>
          <Card className="row-span-2">
            <ScrollArea className="h-full">
              <FileStatsPanel fileCommon={fileData.file} />
            </ScrollArea>
          </Card>
          <Card className="overflow-show">
            <FileTagsPanel mainFile={mainFile} />
          </Card>
        </div>
      </div>
    </div>
  );
};
