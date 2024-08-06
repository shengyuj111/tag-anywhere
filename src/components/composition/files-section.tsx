import { GetFilesRequest, useGetAllFilesQuery } from "@/api/api/file-api";
import { FileCoverAspectRatio } from "@/lib/file-enum";
import {
  useEffect,
  useState,
  useRef,
  ReactNode,
  ReactElement,
  useCallback,
  useMemo,
} from "react";
import { cn } from "@/lib/utils";
import { FileDisplay } from "./file-display";
import { Loaders } from "../ui/loaders";
import { Visibility } from "../ui/visibility";
import { H1 } from "../ui/typography";
import PaginationControl from "./pagination-control";

const pageSizeOptions = [10, 20, 40, 80];

export interface FilesSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  fileCoverAspectRatio: FileCoverAspectRatio;
  includeTagIds?: number[];
  excludeTagIds?: number[];
  includeFileIds?: number[];
  excludeFileIds?: number[];
  nameRegex?: string;
  ignoreChildren?: boolean;
  contextMenuWrapper?: (props: {
    children: ReactNode;
    fileId: number;
  }) => ReactElement;
}

export const FilesSection = ({
  className,
  fileCoverAspectRatio,
  includeTagIds,
  excludeTagIds,
  includeFileIds,
  excludeFileIds,
  nameRegex,
  ignoreChildren,
  contextMenuWrapper: ContextMenuWrapper,
}: FilesSectionProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const { data: filesDate, isLoading: isFetchingFiles } = useGetAllFilesQuery({
    includeTagIds,
    excludeTagIds,
    includeFileIds,
    excludeFileIds,
    nameRegex,
    ignoreChildren,
    pageSize,
    page: currentPage,
  } as GetFilesRequest);
  const files = useMemo(() => filesDate?.files ?? [], [filesDate?.files]);
  const totalPages = filesDate?.totalPages ?? 0;

  const sectionContainerRef = useRef<HTMLDivElement>(null);
  const fileContainerRef = useRef<HTMLDivElement>(null);

  const calculateFittedWidth = useCallback(
    (containerWidth: number, itemWidth = 250, gap = 12) => {
      const numberOfItemsInRow = Math.floor(
        (containerWidth + gap) / (itemWidth + gap),
      );
      const fittedWidth = numberOfItemsInRow * (itemWidth + gap) - gap;
      return fittedWidth;
    },
    [],
  );

  const updateFittedWidth = useCallback(() => {
    if (fileContainerRef.current && sectionContainerRef.current) {
      const containerWidth = sectionContainerRef.current.clientWidth;
      const fittedWidth = calculateFittedWidth(containerWidth);
      fileContainerRef.current.style.width = `${fittedWidth}px`;
    }
  }, [calculateFittedWidth]);

  useEffect(() => {
    window.addEventListener("resize", updateFittedWidth);
    updateFittedWidth();

    return () => {
      window.removeEventListener("resize", updateFittedWidth);
    };
  }, [updateFittedWidth]);

  useEffect(() => {
    updateFittedWidth();
  }, [currentPage, pageSize, files, updateFittedWidth]);

  return (
    <div
      ref={sectionContainerRef}
      className={cn("w-full h-full flex flex-col items-center", className)}
    >
      <div
        ref={fileContainerRef}
        className="flex flex-wrap justify-start items-start gap-3"
      >
        <Loaders.circular
          size="large"
          layout="area"
          loading={isFetchingFiles}
        />
        <Visibility isVisible={!isFetchingFiles}>
          {files.map((file) => {
            const FileComponent = (
              <FileDisplay
                key={file.id}
                fileCommon={file}
                fileCoverAspectRatio={fileCoverAspectRatio}
              />
            );

            return ContextMenuWrapper ? (
              <ContextMenuWrapper key={file.id} fileId={file.id}>
                {FileComponent}
              </ContextMenuWrapper>
            ) : (
              FileComponent
            );
          })}
        </Visibility>
        <Visibility isVisible={files.length !== 0}>
          <PaginationControl
            itemsPerPage={pageSize}
            setItemsPerPage={setPageSize}
            itemsPerPageOptions={pageSizeOptions}
            currentPage={currentPage}
            totalPages={totalPages}
            setPageNumber={setCurrentPage}
          />
        </Visibility>
      </div>
      <Visibility isVisible={files.length === 0}>
        <div className="flex-1">
          <H1 className="text-muted-foreground">Nothing</H1>
        </div>
      </Visibility>
    </div>
  );
};
