import { useDeleteAllFilesMutation } from "@/api/api/file-api";
import { useCleanUpUnusedFilesMutation } from "@/api/api/helper-api";
import { useGetGlobalSettingsQuery, useSetGlobalSettingsMutation } from "@/api/api/settings-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loaders } from "@/components/ui/loaders";
import { Separator } from "@/components/ui/separator";
import { H3, Large, Muted, Small } from "@/components/ui/typography";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clamp } from "lodash";

export const SettingsPage = () => {
  const { data: settings } = useGetGlobalSettingsQuery();
  const [setSettings, { isLoading: isSettingsSettings }] = useSetGlobalSettingsMutation();
  const [deleteUsedCover, { isLoading: isDeletingCover }] =
    useCleanUpUnusedFilesMutation();
  const [deleteAllFiles, { isLoading: isDeletingAllFiles }] =
    useDeleteAllFilesMutation();

  const [volume, setVolume] = useState(settings!.volume * 100);

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

  const handleSaveVolume = async () => {
    console.log(volume);
    await setSettings({
      volume: clamp(volume, 0, 100) / 100,
    });
    toast({
      title: "Saved",
      description: "Volume has been saved.",
    });
  }

  const handleResetVolume = async () => {
    setVolume(settings!.volume * 100);
  }

  return (
    <div className="w-full flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <H3>General Settings</H3>
        <Large className="text-sm font-normal text-muted-foreground">
          Configure your preference here
        </Large>
      </div>
      <Separator />
      <div className="flex flex-row items-center justify-start gap-2 rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <Small>Index Path</Small>
          <Muted>Path to store covers and database</Muted>
        </div>
        <div className="flex-grow" />
        <Input defaultValue={settings!.indexPath ?? ""} className="w-[200px]" disabled />
        <Button size="sm" onClick={() => navigate("/setup")}>
          Reset
        </Button>
      </div>
      <div className="flex flex-row items-center justify-start gap-2 rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <Small>Store House Path</Small>
          <Muted>Path to store files</Muted>
        </div>
        <div className="flex-grow" />
        <Input defaultValue={settings!.storehousePath ?? ""} className="w-[200px]" disabled />
        <Button size="sm" onClick={() => navigate("/setup")}>
          Reset
        </Button>
      </div>
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
      <div className="flex flex-col gap-1">
        <H3>Video Settings</H3>
        <Large className="text-sm font-normal text-muted-foreground">
          Configure your video preference here
        </Large>
      </div>
      <Separator />
      <div className="flex flex-row items-center justify-start gap-2 rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <Small>Global Video Volume</Small>
          <Muted>Set start volume of your video</Muted>
        </div>
        <div className="flex-grow" />
        <Input defaultValue={settings!.volume * 100} min={0} max={100} onChange={(e) => setVolume(Number(e.target.value))} className="w-[100px]" type="number" placeholder="0-100" />
        <Button size="sm" onClick={handleSaveVolume} disabled={isSettingsSettings}>
          <Loaders.circular className="w-4 h-4 mr-2" loading={isSettingsSettings} />
          Save
        </Button>
        <Button variant="secondary" size="sm" onClick={handleResetVolume} disabled={isSettingsSettings}>
          Reset
        </Button>
      </div>
    </div>
  );
};
