import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { FilesSection } from "@/components/composition/files-section";
import { FileCoverAspectRatio } from "@/lib/file-enum";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BackableHeader } from "@/components/composition/backable-header";
import { useUpdateLibraryForm } from "@/pages/create/library-form/form";
import { useSectionHook } from "@/components/composition/section-hook";
import { LibraryForm } from "@/pages/create/library-form/library-form";

export const LibraryDetailsPage = () => {
  const [ignoreChildren, setIgnoreChildren] = useState(true);
  const { libraryId } = useParams();
  const { form, onSubmit, isUpdatingLibrary } = useUpdateLibraryForm(libraryId!);
  const {
    currentPage, 
    setCurrentPage,
    pageSize,
    setPageSize,
  } = useSectionHook("library-details");
  return (
    <>
      <div className="w-full h-full flex justify-center">
        <div className="w-[80%] h-full flex flex-col items-center gap-4 ">
          <BackableHeader title="Library Details" />
          <div className="flex gap-4 w-full flex-grow">
            <Card className="w-[20%] h-full p-6">
              <LibraryForm
                form={form}
                onSubmit={onSubmit}
                isSubmitting={isUpdatingLibrary}
                onCancel={() => {}}
                submitButtonText="Update Library"
              />
            </Card>
            <Card className="w-full h-full p-6 flex flex-col gap-8">
              <div className="w-full flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={ignoreChildren}
                    onCheckedChange={setIgnoreChildren}
                  />
                  <Label>Ignore Subfile</Label>
                </div>
                <div className="flex-1" />
              </div>
              <div className="w-full flex-1">
                <FilesSection
                  fileCoverAspectRatio={FileCoverAspectRatio.Book}
                  includeInName={form.getValues().includeInName}
                  ignoreChildren={ignoreChildren}
                  includeTagIds={(form.getValues().includeTags || []).map(
                    (tag) => Number(tag.value),
                  )}
                  excludeTagIds={(form.getValues().excludeTags || []).map(
                    (tag) => Number(tag.value),
                  )}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  setCurrentPage={setCurrentPage}
                  setPageSize={setPageSize}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};
