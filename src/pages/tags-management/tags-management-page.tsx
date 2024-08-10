import { ArrowDownNarrowWideIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { TagCommon, useCreateTagMutation } from "@/api/api/tag-api";
import { DataProvider } from "@/components/provider/data-provider/data-provider";
import { useData } from "@/components/provider/data-provider/data-context";
import { H3, H4 } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { TagForm } from "../create/tag-form";
import { tagForm } from "../create/forms";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { TagsSection } from "@/components/composition/tags-section";
import { TagDisplay } from "@/components/composition/tag-display";
import Combobox from "@/components/ui/combobox";
import { Toggle } from "@/components/ui/toggle";

type TagsManagementData = {
  searchName: string;
  setSearchName: (name: string) => void;
};

export const TagsManagementPage = () => {
  const [searchName, setSearchName] = useState<string>("");
  const [column, setColumn] = useState<string | undefined>(
    sessionStorage.getItem("tags-management-column") ?? "id",
  );
  const [isAscending, setIsAscending] = useState(
    sessionStorage.getItem("tags-management-is-ascending") === "true",
  );
  const [createTag, { isLoading: isCreatingTag }] = useCreateTagMutation();

  const form = useForm<z.infer<typeof tagForm>>({
    resolver: zodResolver(tagForm),
    defaultValues: {
      tagName: "",
      type: "default",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof tagForm>) => {
    try {
      await createTag({
        ...values,
        name: values.tagName,
        color: null,
      });
      toast({
        title: "Tag Created",
        description: "Tag has been created",
      });
      return true;
    } catch (error) {
      toast({
        title: "Failed to create tag",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    }
  };

  const name = form.watch("tagName");
  const coverPath = form.watch("coverPath");

  const previewTag = useMemo(() => {
    return {
      id: 0,
      name: name === "" ? "Tag Name" : name,
      type: "default",
      color: null,
      coverPath: coverPath === "" ? undefined : coverPath,
      description: "",
    } as TagCommon;
  }, [name, coverPath]);

  const handleSetColumn = (column: string | undefined) => {
    setColumn(column!);
    sessionStorage.setItem("tags-management-column", column!);
  };

  const handleSetIsAscending = (isAscending: boolean) => {
    setIsAscending(isAscending);
    sessionStorage.setItem(
      "tags-management-is-ascending",
      isAscending.toString(),
    );
  };

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
      <div className="w-full h-full flex justify-center">
        <div className="w-[95%] h-full flex flex-col items-center gap-4 ">
          <H3 className="w-full flex">All Tags</H3>
          <div className="flex gap-4 w-full flex-grow">
            <Card className="w-[40%] 2xl:w-[20%] h-full p-6 flex flex-col overflow-hidden">
              <TagForm
                form={form}
                onSubmit={onSubmit}
                isSubmitting={isCreatingTag}
                onCancel={() => {}}
                submitButtonText="Create Tag"
              />
              <div className="w-full flex flex-col mt-8 gap-4">
                <H4>Preview</H4>
                <TagDisplay tagCommon={previewTag} numOfFiles={9999} />
              </div>
            </Card>
            <Card className="w-[calc(60%-1rem)] 2xl:w-[calc(80%-1rem)] h-full p-6 flex flex-col gap-8 overflow-hidden">
              <div className="w-full flex-1">
                <TagsSection
                  includeInName={searchName === "" ? undefined : searchName}
                  sortOn={column}
                  isAscending={isAscending}
                >
                  <div className="w-full flex items-center gap-4">
                    <SearchInput />
                    <div className="flex-1" />
                    <Combobox
                      className="w-fit"
                      datas={[
                        { value: "id", label: "Created At" },
                        { value: "name", label: "Name" },
                      ]}
                      selectHint="All"
                      searchHint="Sort Tag By..."
                      noResultsHint="No Results"
                      canUnselect={false}
                      value={column}
                      onChange={handleSetColumn}
                    />
                    <Toggle
                      variant="outline"
                      size="sm"
                      pressed={isAscending}
                      onPressedChange={handleSetIsAscending}
                    >
                      <ArrowDownNarrowWideIcon />
                    </Toggle>
                  </div>
                </TagsSection>
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
