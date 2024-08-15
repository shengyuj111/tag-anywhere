import { ArrowDownNarrowWideIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ReactNode, useMemo } from "react";
import { TagCommon, useDeleteTagMutation } from "@/api/api/tag-api";
import { DataProvider } from "@/components/provider/data-provider/data-provider";
import { useData } from "@/components/provider/data-provider/data-context";
import { H3, H4 } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { TagsSection } from "@/components/composition/tags-section";
import { TagDisplay } from "@/components/composition/tag-display";
import Combobox from "@/components/ui/combobox";
import { Toggle } from "@/components/ui/toggle";
import { useSectionHook } from "@/components/composition/section-hook";
import { useCreateTagForm } from "../create/tag-form/form";
import { TagForm } from "../create/tag-form/tag-form";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { copyToClipboard } from "@/lib/system-utils";
import { toast } from "@/components/ui/use-toast";

type TagsManagementData = {
  searchName: string;
  setSearchName: (name: string) => void;
};

export const TagsManagementPage = () => {
  const {
    searchName,
    setSearchName,
    column,
    handleSetColumn,
    isAscending,
    handleSetIsAscending,
    ...sectionProps
  } = useSectionHook("tags-management");
  const { form, onSubmit, isCreatingTag } = useCreateTagForm();

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
                  contextMenuWrapper={TagContext}
                  {...sectionProps}
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

const TagContext = ({
  children,
  tagCommon,
}: {
  children: ReactNode;
  tagCommon: TagCommon;
}) => {
  const [deleteTag] = useDeleteTagMutation();

  const copyTagName = () => {
    if (!tagCommon) return;
    copyToClipboard(tagCommon.name, (success: boolean) => {
      if (success) {
        toast({
          description: "The tag name has been copied",
        });
      } else {
        toast({
          variant: "destructive",
          description: "The tag name could not be copied",
        });
      }
    });
  };

  const handleDeleteTag = async () => {
    if (!tagCommon) return;
    await deleteTag({ id: tagCommon.id });
    toast({
      title: "Tag Deleted",
      description: "The tag has been deleted",
    });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger disabled={!tagCommon}>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem inset onClick={copyTagName}>
          Copy Tag Name
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive"
          inset
          onClick={handleDeleteTag}
        >
          Delete Tag
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
