import { GetFilesRequest } from "@/api/api/file-api";
import {
  useEffect,
  useRef,
  ReactNode,
  ReactElement,
  useCallback,
  useMemo,
} from "react";
import { cn } from "@/lib/utils";
import { Loaders } from "../ui/loaders";
import { Visibility } from "../ui/visibility";
import { H1 } from "../ui/typography";
import PaginationControl from "./pagination-control";
import { useGetAllTagsQuery } from "@/api/api/tag-api";
import { TagDisplay } from "./tag-display";
import { pageSizeOptions } from "./section-hook";

export interface TagsSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  includeInName?: string;
  ignoreChildren?: boolean;
  sortOn?: string;
  isAscending?: boolean;
  contextMenuWrapper?: (props: {
    children: ReactNode;
    fileId: number;
  }) => ReactElement;
  children?: ReactNode;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
}

export const TagsSection = ({
  className,
  includeInName,
  sortOn,
  isAscending,
  contextMenuWrapper: ContextMenuWrapper,
  children,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
}: TagsSectionProps) => {
  const { data: tagsData, isLoading: isFetchingTags } = useGetAllTagsQuery({
    includeInName,
    pageSize,
    sortOn,
    isAscending,
    page: currentPage,
  } as GetFilesRequest);
  const tags = useMemo(() => tagsData?.tags ?? [], [tagsData?.tags]);
  const totalPages = useMemo(() => tagsData?.totalPages ?? 0, [tagsData?.totalPages]);

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
  }, [currentPage, pageSize, tags, updateFittedWidth]);

  useEffect(() => {
    if (currentPage > totalPages) {
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
        <Loaders.circular size="large" layout="area" loading={isFetchingTags} />
        <Visibility isVisible={!isFetchingTags}>
          {tags.map((tag) => {
            const TagComponent = <TagDisplay key={tag.id} tagCommon={tag} />;

            return ContextMenuWrapper ? (
              <ContextMenuWrapper key={tag.id} fileId={tag.id}>
                {TagComponent}
              </ContextMenuWrapper>
            ) : (
              TagComponent
            );
          })}
        </Visibility>
        <Visibility isVisible={tags.length !== 0}>
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
      <Visibility isVisible={tags.length === 0}>
        <div className="flex-1">
          <H1 className="text-muted-foreground">Nothing</H1>
        </div>
      </Visibility>
    </div>
  );
};
