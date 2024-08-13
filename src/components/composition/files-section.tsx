import { GetFilesRequest, useGetAllFilesQuery } from "@/api/api/file-api";
import { FileCoverAspectRatio } from "@/lib/file-enum";
import {
  useEffect,
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
import { pageSizeOptions } from "./section-hook";

export interface FilesSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  fileCoverAspectRatio: FileCoverAspectRatio;
  includeTagIds?: number[];
  excludeTagIds?: number[];
  includeFileIds?: number[];
  excludeFileIds?: number[];
  includeInName?: string;
  ignoreChildren?: boolean;
  sortOn?: string;
  isAscending?: boolean;
  includeType?: string;
  contextMenuWrapper?: (props: {
    children: ReactNode;
    fileId: number;
  }) => ReactElement;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  children?: ReactNode;
}

export const FilesSection = ({
  className,
  fileCoverAspectRatio,
  includeTagIds,
  excludeTagIds,
  includeFileIds,
  excludeFileIds,
  includeInName,
  includeType,
  ignoreChildren,
  sortOn,
  isAscending,
  contextMenuWrapper: ContextMenuWrapper,
  children,
  currentPage,
  setCurrentPage,
  pageSize, 
  setPageSize,
}: FilesSectionProps) => {
  const { data: filesDate, isLoading: isFetchingFiles } = useGetAllFilesQuery({
    includeTagIds,
    excludeTagIds,
    includeFileIds,
    excludeFileIds,
    includeInName,
    ignoreChildren,
    sortOn,
    isAscending,
    includeType,
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

  useEffect(() => {
    if (totalPages !== 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, setCurrentPage, currentPage]);

  return (
    <div
      ref={sectionContainerRef}
      className={cn("w-full h-full flex flex-col items-center", className)}
    >
      <div
        ref={fileContainerRef}
        className="flex flex-wrap justify-start items-start gap-3"
      >
        {children}
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
