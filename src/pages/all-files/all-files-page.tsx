import { useGetAllFilesQuery, useScanFilesMutation } from "@/api/api/file-api";
import { FileDisplay } from "@/components/composition/file-display";
import { useStorage } from "@/components/provider/storage-provider/storage-provider";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { Button } from "@/components/ui/button";
import { Loaders } from "@/components/ui/loaders";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectGroupOptionsType } from "@/components/ui/select-helper";
import { Visibility } from "@/components/ui/visibility";
import { skipToken } from "@reduxjs/toolkit/query";
import { ScanTextIcon, SearchIcon } from "lucide-react";
import { useState, useEffect } from "react";
import Database from "tauri-plugin-sql-api";

export const AllFilesPage = () => {
  const { currentDatabase } = useStorage()!;
  const [db, setDb] = useState<Database | null>(null);
  const { data: filesResponse, isFetching: isFetchingFiles } =
    useGetAllFilesQuery(db === null ? skipToken : {});
  const files = filesResponse?.files ?? [];
  const { config } = useStorage()!;
  const [scanFiles, { isLoading: isScanning }] = useScanFilesMutation();

  useEffect(() => {
    setDb(currentDatabase);
  }, [currentDatabase]);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Files</h1>
        <Button
          disabled={isScanning || isFetchingFiles || !config}
          onClick={() => {
            scanFiles();
          }}
        >
          <Loaders.circular size="small" loading={isScanning} />
          <ScanTextIcon className="w-4 h-4 mr-2" />
          Scan
        </Button>
      </div>
      <div className="flex gap-2">
        <SearchInput />
        <SearchSelect
          placeholder="Extension"
          options={[
            {
              label: "Extensions",
              options: [
                { value: "tag1", label: "Tag 1" },
                { value: "tag2", label: "Tag 2" },
                { value: "tag3", label: "Tag 3" },
              ],
            },
          ]}
        />
        <Button>Search</Button>
      </div>
      <Loaders.circular size="large" layout="area" loading={isFetchingFiles} />
      <Visibility isVisible={!isFetchingFiles}>
        <div className="flex flex-wrap items-start justify-start gap-3">
          {files?.map((file) => (
            <FileDisplay key={file.id} fileCommon={file} />
          ))}
        </div>
      </Visibility>
    </>
  );
};

export const SearchInput = () => {
  return (
    <div className="flex flex-1 max-w-[500px] relative">
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <AutosizeTextarea
        placeholder="Search products..."
        minHeight={10}
        className="h-10 flex-grow appearance-none bg-accent pl-8 shadow-none md:w-2/3 lg:w-1/3"
      />
    </div>
  );
};

export const SearchSelect = ({
  placeholder,
  options,
}: {
  placeholder: string;
  options: SelectGroupOptionsType;
}) => {
  return (
    <Select>
      <SelectTrigger className="w-[120px] bg-accent">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((group, index) => (
          <SelectGroup key={index}>
            <SelectLabel>{group.label}</SelectLabel>
            {group.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};
