import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import React, { useState } from "react";
import { Skeleton } from "./skeleton";

const imageVariants = cva("rounded-md object-cover w-full h-full", {
  variants: {
    variant: {
      default: "transition-all hover:scale-105",
      static: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface ImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement>,
    VariantProps<typeof imageVariants> {}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ className, variant, onLoad, ...props }, ref) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isImageError, setIsImageError] = useState(false);

    return (
      <>
        {!isImageLoaded && <Skeleton className="w-full h-full" />}
        {!isImageError && (
          <img
            className={cn(imageVariants({ variant, className }))}
            ref={ref}
            onError={() => {
              setIsImageError(true);
            }}
            onLoad={(e) => {
              onLoad && onLoad(e);
              setIsImageError(false);
              setIsImageLoaded(true);
            }}
            {...props}
          />
        )}
      </>
    );
  },
);

Image.displayName = "Image";

export default Image;
