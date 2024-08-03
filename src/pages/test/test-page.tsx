import apiSlice from "@/api/api-slice";
import { useDeleteAllFilesMutation } from "@/api/api/file-api";
import { useCleanUpUnusedFilesMutation } from "@/api/api/helper-api";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
export const TestPage = () => {
  const dispatch = useAppDispatch();
  const [deleteAllFiles] = useDeleteAllFilesMutation();
  const [deleteUsedCover] = useCleanUpUnusedFilesMutation();

  return (
    <div className="flex-1 flex flex-col justify-center items-center">
      <div className="flex flex-wrap justify-start items-end gap-2">
        <Button onClick={() => deleteAllFiles()}>Delete All Files</Button>
        <Button onClick={() => dispatch(apiSlice.util.resetApiState())}>
          Refresh
        </Button>
        <Button onClick={() => deleteUsedCover()}>Clean Cover</Button>
      </div>
    </div>
  );
};
