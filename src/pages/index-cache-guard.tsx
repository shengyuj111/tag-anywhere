import { useGetGlobalSettingsQuery } from "@/api/api/settings-api";
import { useStorage } from "@/components/provider/storage-provider/storage-provider";
import { Loaders } from "@/components/ui/loaders";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

export const IndexCacheGuard = () => {
  const { data: settings, isLoading } = useGetGlobalSettingsQuery();
  const navigate = useNavigate();
  const { setSettings } = useStorage()!;

  useEffect(() => {
    if (isLoading) return;
    if (settings === null || settings === undefined) navigate("/setup");
    if (!settings!.indexPath) navigate("/setup");
    if (!settings!.storehousePath) navigate("/setup");

    setSettings(settings!);
  }, [settings, isLoading, navigate, setSettings]);

  return isLoading ? <LoadingScreen /> : <Outlet />;
};

const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-accent">
      <Loaders.circular size="large" />
      <h1 className="text-white">Loading...</h1>
    </div>
  );
};
