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
    const [currentPage, setCurrentPage] = useState(sessionStorage.getItem(`${id}-page`) ? Number(sessionStorage.getItem(`${id}-page`)) : 1);
    const [pageSize, setPageSize] = useState(sessionStorage.getItem(`${id}-page-size`) ? Number(sessionStorage.getItem(`${id}-page-size`)) : pageSizeOptions[0]);

    const handleSetPageSize = (size: number) => {
        setPageSize(size);
        sessionStorage.setItem(`${id}-page-size`, size.toString());
      }

      const handleSetCurrentPage = (page: number) => {
        setCurrentPage(page);
        sessionStorage.setItem(`${id}-page`, page.toString());
      }

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
        setCurrentPage: handleSetCurrentPage, 
        pageSize, 
        setPageSize: handleSetPageSize, 
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