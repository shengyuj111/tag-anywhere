import { useGetSetupConfigQuery } from "@/api/api/setup-api";
import { useStorage } from "@/components/provider/storage-provider/storage-provider";
import { Loaders } from "@/components/ui/loaders";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

export const IndexCacheGuard = () => {
  const { data: config, isFetching } = useGetSetupConfigQuery();
  const navigate = useNavigate();
  const { setConfig } = useStorage()!;

  useEffect(() => {
    // console.log(config);
    if (!isFetching && !config) {
      navigate("/setup");
    }
    setConfig(config!);
  }, [config, isFetching, navigate, setConfig]);

  return isFetching || !config ? <LoadingScreen /> : <Outlet />;
};

const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-accent">
      <Loaders.circular size="large" />
      <h1 className="text-white">Loading...</h1>
    </div>
  );
};
