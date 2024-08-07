import { useDeleteAllFilesMutation } from "@/api/api/file-api";
import { useCleanUpUnusedFilesMutation } from "@/api/api/helper-api";
import { Button } from "@/components/ui/button";
import { Loaders } from "@/components/ui/loaders";
import { Separator } from "@/components/ui/separator";
import { H3, Large, Muted, Small } from "@/components/ui/typography";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export const SettingsPage = () => {
  const [deleteUsedCover, { isLoading: isDeletingCover }] =
    useCleanUpUnusedFilesMutation();
  const [deleteAllFiles, { isLoading: isDeletingAllFiles }] =
    useDeleteAllFilesMutation();
  const navigate = useNavigate();

  const handleCleanCover = async () => {
    await deleteUsedCover();
    toast({
      title: "Cleaned",
      description: "All the unused cover images are removed.",
    });
  };

  const handleSetNewPath = async () => {
    navigate("/setup");
  };

  const handleDeleteAllFiles = async () => {
    await deleteAllFiles();
    toast({
      title: "Deleted",
      description: "All the files are removed from the database.",
    });
  };

  return (
    <>
      <div className="flex flex-col gap-1">
        <H3>Settings</H3>
        <Large className="text-sm font-normal text-muted-foreground">
          Configure youe preference here
        </Large>
      </div>
      <Separator />
      <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <Small>Clean Space</Small>
          <Muted>Remove all the unused cover images from your computer.</Muted>
        </div>
        <Button size="sm" onClick={handleCleanCover}>
          <Loaders.circular
            className="w-4 h-4 mr-2"
            loading={isDeletingCover}
          />
          Clean
        </Button>
      </div>
      <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <Small>Set a New Path</Small>
          <Muted>Use a new path to store your files.</Muted>
        </div>
        <Button size="sm" onClick={handleSetNewPath}>
          <Loaders.circular
            className="w-4 h-4 mr-2"
            loading={isDeletingCover}
          />
          Set
        </Button>
      </div>
      <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <Small>Delete ALl Files</Small>
          <Muted>Delete all the files from the database.</Muted>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDeleteAllFiles}>
          <Loaders.circular
            className="w-4 h-4 mr-2"
            loading={isDeletingAllFiles}
          />
          Delete
        </Button>
      </div>
    </>
  );
};
