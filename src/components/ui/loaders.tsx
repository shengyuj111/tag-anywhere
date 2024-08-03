import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import { Visibility } from "./visibility";

export const loaderVariants = cva("", {
  variants: {
    size: {
      small: "h-4 w-4",
      medium: "h-6 w-6",
      large: "h-8 w-8",
    },
    layout: {
      default: "",
      row: "flex flex-row items-center justify-center w-full",
      col: "flex flex-col items-center justify-center h-full",
      area: "flex flex-row items-center justify-center w-full h-full",
    },
  },
  defaultVariants: {
    size: "small",
    layout: "default",
  },
});

interface LoaderProps extends VariantProps<typeof loaderVariants> {
  className?: string;
  loading?: boolean;
  id?: string;
}

export const BaseLoader = ({
  className,
  loading = true,
  size,
  layout,
  id,
}: LoaderProps) => {
  return loading ? (
    <div id={id} className={cn(loaderVariants({ layout, size, className }))}>
      <Loader2Icon
        className={cn(loaderVariants({ size, className: "animate-spin" }))}
      />
    </div>
  ) : null;
};
BaseLoader.displayName = "Loader";

export const Loaders = Object.assign(BaseLoader, {
  circular: BaseLoader,
  zone: Visibility,
});
