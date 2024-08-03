import { useContext } from "react";
import { DialogContext } from "../provider/dialog-provider/dialog-service-provider";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

interface AlertDialogProps {
  title: string;
  description?: string;
  messages?: string[];
  buttonLabel: string;
  onConfirm?: () => void;
}

export const AlertDialog = ({
  title,
  description,
  buttonLabel,
  onConfirm,
  messages = [],
}: AlertDialogProps) => {
  const dialogManager = useContext(DialogContext).manager;
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    dialogManager.closeDialog();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <ScrollArea className="max-h-60 overflow-y-auto">
          {messages.map((message, index) => (
            <DialogDescription key={index}>{message}</DialogDescription>
          ))}
        </ScrollArea>
      </DialogHeader>
      <DialogFooter className="sm:justify-start">
        <Button
          type="button"
          onClick={handleConfirm}
          variant="secondary"
          className="w-full"
        >
          {buttonLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
