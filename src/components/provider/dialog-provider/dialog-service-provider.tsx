import { Dialog } from "@/components/ui/dialog";
import {
  PropsWithChildren,
  ReactElement,
  ReactNode,
  createContext,
  useEffect,
  useState,
} from "react";

export interface DialogInterface {
  width?: string;
  child: ReactElement;
  forcedClose?: () => void;
  onClose?: () => void;
}

export class DialogManager {
  private current: DialogInterface | null = null;
  private onChangeCallback: null | ((model: DialogInterface | null) => void) =
    null;
  public static instance: DialogManager;

  constructor() {
    if (DialogManager.instance) {
      return DialogManager.instance;
    }

    DialogManager.instance = this;
  }

  private triggerOnChange(): void {
    if (this.onChangeCallback !== null) {
      this.onChangeCallback(this.current);
    }
  }

  public openDialog(model: DialogInterface): void {
    if (this.current !== null && this.current.forcedClose !== undefined) {
      this.current.forcedClose();
    }
    this.current = model;
    this.triggerOnChange();
  }

  public closeDialog(): void {
    if (this.current !== null && this.current.onClose !== undefined) {
      this.current.onClose();
    }
    this.current = null;
    this.triggerOnChange();
  }

  public get currentDialog(): DialogInterface | null {
    return this.current;
  }

  public register({
    onChangeCallback,
  }: {
    onChangeCallback: (model: DialogInterface | null) => void;
  }): void {
    this.onChangeCallback = onChangeCallback;
  }
}

interface DialogContextType {
  manager: DialogManager;
}

export const DialogContext = createContext<DialogContextType>({
  manager: new DialogManager(),
});

export function DialogServiceProvider({
  children,
}: PropsWithChildren): ReactNode {
  const [dialogManager] = useState<DialogManager>(new DialogManager());
  const [currentDialog, setCurrentDialog] = useState<DialogInterface | null>(
    null,
  );

  const contextValue: DialogContextType = {
    manager: dialogManager,
  };

  const refreshDialog: (model: DialogInterface | null) => void = (model) => {
    setCurrentDialog(model);
  };

  useEffect(() => {
    dialogManager.register({ onChangeCallback: refreshDialog });
  });

  return (
    <DialogContext.Provider value={contextValue}>
      <Dialog
        open={currentDialog !== null}
        onOpenChange={() => dialogManager.closeDialog()}
      >
        {currentDialog?.child}
      </Dialog>
      {children}
    </DialogContext.Provider>
  );
  return children;
}
