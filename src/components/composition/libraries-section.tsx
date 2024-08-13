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
import { useGetAllLibrariesQuery } from "@/api/api/library-api";
import { LibraryDisplay } from "./library-display";
import { pageSizeOptions } from "./section-hook";

export interface LibrariesSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  includeInName?: string;
  ignoreChildren?: boolean;
  sortOn?: string;
  isAscending?: boolean;
  contextMenuWrapper?: (props: {
    children: ReactNode;
    libraryId: number;
  }) => ReactElement;
  children?: ReactNode;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
}

export const LibrariesSection = ({
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
}: LibrariesSectionProps) => {
  const { data: librariesData, isLoading: isFetchingLibraries } =
    useGetAllLibrariesQuery({
      includeInName,
      pageSize,
      sortOn,
      isAscending,
      page: currentPage,
    } as GetFilesRequest);
  const libraries = useMemo(
    () => librariesData?.libraries ?? [],
    [librariesData?.libraries],
  );
  const totalPages = librariesData?.totalPages ?? 0;

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
  }, [currentPage, pageSize, libraries, updateFittedWidth]);

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
        <Loaders.circular
          size="large"
          layout="area"
          loading={isFetchingLibraries}
        />
        {children}
        <Visibility isVisible={!isFetchingLibraries}>
          {libraries.map((library) => {
            const LibraryComponent = (
              <LibraryDisplay key={library.id} library={library} />
            );

            return ContextMenuWrapper ? (
              <ContextMenuWrapper key={library.id} libraryId={library.id}>
                {LibraryComponent}
              </ContextMenuWrapper>
            ) : (
              LibraryComponent
            );
          })}
        </Visibility>
        <Visibility isVisible={libraries.length !== 0}>
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
      <Visibility isVisible={libraries.length === 0}>
        <div className="flex-1">
          <H1 className="text-muted-foreground">Nothing</H1>
        </div>
      </Visibility>
    </div>
  );
};
