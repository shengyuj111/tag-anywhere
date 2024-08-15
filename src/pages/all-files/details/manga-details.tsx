import { useMemo } from "react";
import { FileDetailProps } from "./file-details-type";
import { BackableHeader } from "@/components/composition/backable-header";
import { formatFileName } from "@/lib/format-utils";
import Image from "@/components/ui/image";
import { pathToUrl } from "@/api/api/helper";
import { Card } from "@/components/ui/card";
import { FileTagsPanel } from "@/components/composition/file-tags-panel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const ManageDetails = ({ fileData, onUpdateName }: FileDetailProps) => {
  const mainFile = useMemo(() => fileData?.file, [fileData]);
  const fileChildren = useMemo(() => fileData?.fileChildren, [fileData]);

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-[50%] flex flex-col items-center gap-4 ">
        <BackableHeader
          title={formatFileName(mainFile?.name)}
          onEditSubmit={onUpdateName}
        />
        <Accordion className="w-full" type="single" collapsible>
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
        <Card className="w-full overflow-show">
          <FileTagsPanel mainFile={mainFile} />
        </Card>
        <div className="w-full flex flex-col gap-1">
          {fileChildren.map((file) => (
            <Image
              key={file.id}
              variant="static"
              src={pathToUrl(file.path)}
              alt={file.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
