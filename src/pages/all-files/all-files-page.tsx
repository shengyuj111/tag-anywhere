import { useGetAllFilesQuery, useScanFilesMutation } from "@/api/api/file-api";
import { BackableHeader } from "@/components/composition/backable-header";
import { FileDisplay } from "@/components/composition/file-display";
import { useStorage } from "@/components/provider/storage-provider/storage-provider";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { LibraryForm } from "../create/library-form";
import { CreateLibraryRequest, useCreateLibraryMutation } from "@/api/api/library-api";
import { libraryForm } from "../create/forms";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilesSection } from "@/components/composition/files-section";
import { FileCoverAspectRatio } from "@/lib/file-enum";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { H3, H4 } from "@/components/ui/typography";

export const AllFilesPage = () => {
  const { currentDatabase } = useStorage()!;
  const [db, setDb] = useState<Database | null>(null);
  const [createLibrary, { isLoading: isCreatingLibrary }] = useCreateLibraryMutation();
  const { data: filesResponse, isFetching: isFetchingFiles } =
    useGetAllFilesQuery(db === null ? skipToken : {});
  const files = filesResponse?.files ?? [];
  const { config } = useStorage()!;
  const [scanFiles, { isLoading: isScanning }] = useScanFilesMutation();
  const form = useForm<z.infer<typeof libraryForm>>({
    resolver: zodResolver(libraryForm),
    defaultValues: {
      name: "",
      coverPath: "",
      nameRegex: "",
      ignoreChildren: true,
      includeTags: [],
      excludeTags: [],
    },
  });

  useEffect(() => {
    setDb(currentDatabase);
  }, [currentDatabase]);

  const onSubmit = async (values: z.infer<typeof libraryForm>) => {
    try {
      await createLibrary({
        name: values.name,
        nameRegx: values.nameRegex === "" ? null : values.nameRegex,
        coverPath: values.coverPath,
        includeTagIds:
          values.includeTags?.map((tag) => Number(tag.value)) ?? [],
        excludeTagIds:
          values.excludeTags?.map((tag) => Number(tag.value)) ?? [],
        includeFileIds: [],
        excludeFileIds: [],
      } as CreateLibraryRequest);
      toast({
        title: "Library Created",
        description: "Library has been created",
      });
      return true;
    } catch (error) {
      toast({
        title: "Failed to create library",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <>
      <div className="w-full h-full flex justify-center">
      <div className="w-[80%] h-full flex flex-col items-center gap-4 ">
        <H3 className="w-full flex">
          All Files
        </H3>
        <div className="flex gap-4 w-full flex-grow">
          <Card className="w-[20%] h-full p-6">
            <LibraryForm 
              form={form}
              onSubmit={onSubmit} 
              isSubmitting={isCreatingLibrary} 
              onCancel={() => {}}
              submitButtonText="Create Library"
            />
          </Card>
          <Card className="w-[calc(80%-1rem)] h-full p-6 flex flex-col gap-8">
            <div className="w-full flex items-center gap-4">
              <div className="flex-1" />
              <Button
                disabled={isScanning || isFetchingFiles || !config}
                onClick={() => {
                  scanFiles({});
                }}
              >
                <Loaders.circular size="small" loading={isScanning} />
                <ScanTextIcon className="w-4 h-4 mr-2" />
                Scan
              </Button>
            </div>
            <div className="w-full flex-1">
              <FilesSection 
                fileCoverAspectRatio={FileCoverAspectRatio.Book}
                nameRegex={form.getValues().nameRegex}
                ignoreChildren={form.getValues().ignoreChildren}
                includeTagIds={(form.getValues().includeTags || []).map((tag) => Number(tag.value))}
                excludeTagIds={(form.getValues().excludeTags || []).map((tag) => Number(tag.value))}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
};
