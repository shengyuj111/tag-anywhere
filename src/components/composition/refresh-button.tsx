import { RefreshCwIcon } from "lucide-react";
import { Button } from "../ui/button";
import { useAppDispatch } from "@/store/hooks";
import apiSlice from "@/api/api-slice";

export const RefreshButton = () => {
  const dispatch = useAppDispatch();
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => dispatch(apiSlice.util.resetApiState())}
    >
      <RefreshCwIcon className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Refresh</span>
    </Button>
  );
};
