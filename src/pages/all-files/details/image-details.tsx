import { BackableHeader } from "@/components/composition/backable-header";
import { FileStatsPanel } from "@/components/composition/file-stats-panel";
import { FileTagsPanel } from "@/components/composition/file-tags-panel";
import { Card } from "@/components/ui/card";
import { formatFileName } from "@/lib/format-utils";
import { useMemo } from "react";
import { FileDetailProps } from "./file-details-type";
import { ImageViewer } from "@/components/composition/image-viewer";
import { pathToUrl } from "@/api/api/helper";

export const ImageDetails = ({ fileData }: FileDetailProps) => {
  const mainFile = useMemo(() => fileData?.file, [fileData]);

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-[80%] flex flex-col items-center gap-4 ">
        <BackableHeader title={formatFileName(mainFile?.name)} />
        <div className="w-full h-full gap-4 grid grid-cols-[70%_1fr] grid-rows-[72%_1fr]">
          <Card className="h-full overflow-hidden">
            <ImageViewer src={pathToUrl(mainFile?.path)} />
          </Card>
          <Card className="row-span-2">
            <FileStatsPanel
              fileCommon={fileData.file}
              timeStamp={fileData.timeStamp}
            />
          </Card>
          <Card className="flex-grow h-full">
            <FileTagsPanel mainFile={mainFile} />
          </Card>
        </div>
      </div>
    </div>
  );
};
