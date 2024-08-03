import { clamp } from "lodash";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  pageOffset?: number;
  currentPage: number;
  totalPages: number;
  setPageNumber: (newPage: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (newItemsPerPage: number) => void;
  itemsPerPageOptions: number[];
  className?: string;
}

const PaginationComponent = ({
  pageOffset = 0,
  currentPage,
  totalPages,
  setPageNumber,
  itemsPerPage,
  setItemsPerPage,
  itemsPerPageOptions,
  className,
  ...props
}: PaginationProps) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      setPageNumber(
        clamp(currentPage - 1, 1 + pageOffset, totalPages + pageOffset),
      );
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setPageNumber(
        clamp(currentPage + 1, 1 + pageOffset, totalPages + pageOffset),
      );
    }
  };

  const handlePageClick = (page: number) => {
    setPageNumber(page);
  };
  console.log("itemsPerPage", itemsPerPage);
  console.log("itemsPerPageOptions", itemsPerPageOptions);

  return (
    <div
      className={cn("w-full flex justify-end items-center gap-6", className)}
      {...props}
    >
      <div className="flex gap-2 items-center">
        Items per Page:
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(option) => setItemsPerPage(Number(option))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {itemsPerPageOptions.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      Page {currentPage} of {totalPages}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeftIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={currentPage === 1}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRightIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default PaginationComponent;
