import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { DataProvider } from "@/components/provider/data-provider/data-provider";
import { useData } from "@/components/provider/data-provider/data-context";
import { H3 } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { LibrariesSection } from "@/components/composition/libraries-section";

type HomeData = {
  searchName: string;
  setSearchName: (name: string) => void;
};

export const LibraryPage = () => {
  const [searchName, setSearchName] = useState<string>("");
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
        <div className="w-[80%] h-full flex flex-col items-center gap-4 ">
          <H3 className="w-full flex">Libraries</H3>
          <div className="flex gap-4 w-full flex-grow">
            <Card className="w-full h-full p-6 flex flex-col gap-8">
              <div className="w-full flex items-center gap-4">
                <SearchInput />
                <div className="flex-1" />
              </div>
              <div className="w-full flex-1">
                <LibrariesSection
                  includeInName={searchName === "" ? undefined : searchName}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DataProvider>
  );
};

export const SearchInput = () => {
  const { searchName, setSearchName } =
    useData<HomeData>("home")!;

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
