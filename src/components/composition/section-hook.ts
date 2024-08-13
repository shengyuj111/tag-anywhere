import { useState } from "react";

export const pageSizeOptions = [10, 20, 40, 80];


export const useSectionHook = (id: "tags-management" | "files-management" | "library-details" | "library-management" | "tag-details") => {
    const [searchName, setSearchName] = useState<string>("");
    const [column, setColumn] = useState<string | undefined>(
        sessionStorage.getItem(`${id}-column`) ?? "id",
    );
    const [isAscending, setIsAscending] = useState(
        sessionStorage.getItem(`${id}-is-ascending`) === "true",
    );
    const [typeFilter, setTypeFilter] = useState<string | undefined>(
        sessionStorage.getItem(`${id}-type-filter`) ?? undefined,
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(pageSizeOptions[0]);

    const handleSetColumn = (column: string | undefined) => {
        setColumn(column!);
        sessionStorage.setItem(`${id}-column`, column!);
      };
    
      const handleSetIsAscending = (isAscending: boolean) => {
        setIsAscending(isAscending);
        sessionStorage.setItem(
          `${id}-is-ascending`,
          isAscending.toString(),
        );
      };

      const handleSetTypeFilter = (typeFilter: string | undefined) => {
        setTypeFilter(typeFilter);
        if (typeFilter) {
          sessionStorage.setItem(`${id}-type-filter`, typeFilter);
        } else {
          sessionStorage.removeItem(`${id}-type-filter`);
        }
      };
    
  
    return { 
        currentPage, 
        setCurrentPage, 
        pageSize, 
        setPageSize, 
        searchName,
        setSearchName,
        column,
        handleSetColumn,
        isAscending,
        handleSetIsAscending, 
        typeFilter,
        handleSetTypeFilter
    };
  };