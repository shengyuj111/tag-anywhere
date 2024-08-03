import { toast } from "@/components/ui/use-toast";
import { Middleware } from "@reduxjs/toolkit";

type ActionWithError = {
  error: {
    message: string;
  };
};

const isActionWithError = (action: unknown): action is ActionWithError => {
  return (
    typeof action === "object" &&
    action !== null &&
    "error" in action &&
    typeof (action as ActionWithError).error.message === "string"
  );
};

const errorMiddleware: Middleware = () => (next) => (action) => {
  if (isActionWithError(action)) {
    toast({
      variant: "destructive",
      title: "Error",
      description: action.error.message || "An error occurred",
    });
  }
  return next(action);
};

export default errorMiddleware;
