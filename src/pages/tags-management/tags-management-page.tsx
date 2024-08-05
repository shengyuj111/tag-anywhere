import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useStorage } from "@/components/provider/storage-provider/storage-provider";
import { skipToken } from "@reduxjs/toolkit/query";
import { Loaders } from "@/components/ui/loaders";
import { Visibility } from "@/components/ui/visibility";
import Database from "tauri-plugin-sql-api";
import { useGetAllTagsQuery } from "@/api/api/tag-api";
import { TagDisplay } from "@/components/composition/tag-display";
import { DataProvider } from "@/components/provider/data-provider/data-provider";
import { useData } from "@/components/provider/data-provider/data-context";

type TagsManagementData = {
  searchName: string;
  setSearchName: (name: string) => void;
};

export const TagsManagementPage = () => {
  const [db, setDb] = useState<Database | null>(null);
  const [searchName, setSearchName] = useState<string>("");
  const { currentDatabase } = useStorage()!;
  const { data: tags, isFetching: isFetchingTags } = useGetAllTagsQuery(
    db === null ? skipToken : {},
  );

  useEffect(() => {
    setDb(currentDatabase);
  }, [currentDatabase]);

  return (
    <DataProvider
      data={
        {
          searchName,
          setSearchName,
        } as TagsManagementData
      }
      id="tags-management"
    >
      <div className="flex-1 flex flex-col gap-4 lg:gap-6">
        <div className="flex items-center justify-between pt-4 px-4 lg:px-6 lg:pt-6">
          <h1 className="text-lg font-semibold md:text-2xl">Tags</h1>
        </div>
        <div className="flex gap-2 px-4 lg:px-6">
          <SearchInput />
        </div>
        <div className="w-full flex items-center px-4 lg:px-6">
          <Loaders.circular
            size="large"
            layout="area"
            loading={isFetchingTags}
          />
          <Visibility isVisible={!isFetchingTags}>
            <div className="flex flex-wrap w-full flex-1 gap-4">
              {tags
                ?.filter((tag) => tag.name.includes(searchName))
                .map((tag, index) => (
                  <TagDisplay key={index} tagCommon={tag} />
                ))}
            </div>
          </Visibility>
        </div>
      </div>
    </DataProvider>
  );
};

export const SearchInput = () => {
  const { searchName, setSearchName } =
    useData<TagsManagementData>("tags-management")!;

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
