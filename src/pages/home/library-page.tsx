import { ArrowDownNarrowWideIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ReactNode, useState } from "react";
import { DataProvider } from "@/components/provider/data-provider/data-provider";
import { useData } from "@/components/provider/data-provider/data-context";
import { H3 } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { LibrariesSection } from "@/components/composition/libraries-section";
import {
  DeleteLibraryRequest,
  useDeleteLibraryMutation,
} from "@/api/api/library-api";
import { toast } from "@/components/ui/use-toast";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import Combobox from "@/components/ui/combobox";
import { Toggle } from "@/components/ui/toggle";

type HomeData = {
  searchName: string;
  setSearchName: (name: string) => void;
};

export const LibraryPage = () => {
  const [searchName, setSearchName] = useState<string>("");
  const [column, setColumn] = useState<string | undefined>("id");
  const [isAscending, setIsAscending] = useState(true);
  return (
    <DataProvider
      data={
        {
          searchName,
          setSearchName,
        } as HomeData
      }
      id="home"
    >
      <div className="w-full h-full flex justify-center">
        <div className="w-[95%] h-full flex flex-col items-center gap-4 ">
          <H3 className="w-full flex">Libraries</H3>
          <div className="flex gap-4 w-full flex-grow">
            <Card className="w-full h-full p-6 flex flex-col gap-8">
              <div className="w-full flex-1">
                <LibrariesSection
                  contextMenuWrapper={LibraryContext}
                  includeInName={searchName === "" ? undefined : searchName}
                  sortOn={column}
                  isAscending={isAscending}
                >
                  <div className="w-full flex items-center gap-4 mb-6">
                    <SearchInput />
                    <div className="flex-1" />
                    <Combobox
                      className="w-fit"
                      datas={[
                        { value: "id", label: "Created At" },
                        { value: "name", label: "Name" },
                      ]}
                      selectHint="All"
                      searchHint="Sort Library By..."
                      noResultsHint="No Results"
                      canUnselect={false}
                      value={column}
                      onChange={setColumn}
                    />
                    <Toggle
                      variant="outline"
                      size="sm"
                      pressed={isAscending}
                      onPressedChange={setIsAscending}
                    >
                      <ArrowDownNarrowWideIcon />
                    </Toggle>
                  </div>
                </LibrariesSection>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DataProvider>
  );
};

export const SearchInput = () => {
  const { searchName, setSearchName } = useData<HomeData>("home")!;

  return (
    <div className="flex relative">
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search tags..."
        className="h-10 flex-grow appearance-none bg-accent pl-8 shadow-none md:w-2/3 lg:w-1/3"
        value={searchName}
        onChange={(e) => setSearchName(e.target.value)}
      />
    </div>
  );
};

export const LibraryContext = ({
  children,
  libraryId,
}: {
  children: ReactNode;
  libraryId: number;
}) => {
  const [removeLibrary] = useDeleteLibraryMutation();
  const removeTag = async () => {
    try {
      await removeLibrary({
        id: libraryId,
      } as DeleteLibraryRequest).unwrap();
      toast({
        title: "Library removed",
        description: "Library has been removed",
      });
    } catch (error) {
      toast({
        title: "Failed to remove Library",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={removeTag}>Remove Library</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
