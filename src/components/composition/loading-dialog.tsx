import { DialogContent } from "../ui/dialog";
import { Loaders } from "../ui/loaders";

export const LoadingDialog = () => {
  return (
    <DialogContent>
      <div className="w-400 h-200">
        <Loaders.circular size="large" layout="area" />
      </div>
    </DialogContent>
  );
};
