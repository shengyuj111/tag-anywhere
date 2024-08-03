import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const sliderTrackVariants = cva("", {
  variants: {
    variant: {
      default: "bg-card",
      video: "bg-muted-foreground",
      volume: "bg-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const sliderRangeVariants = cva("", {
  variants: {
    variant: {
      default: "bg-primary",
      video: "bg-white",
      volume: "bg-primary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const sliderThumbVariants = cva("", {
  variants: {
    variant: {
      default: "bg-primary border-primary",
      video: "bg-white border-accent",
      volume: "bg-primary border-primary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
    VariantProps<typeof sliderTrackVariants> {}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, variant, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex touch-none select-none",
      "data-[orientation='horizontal']:h-2 data-[orientation='horizontal']:w-full data-[orientation='horizontal']:items-center",
      "data-[orientation='vertical']:h-full data-[orientation='vertical']:w-2 data-[orientation='vertical']:justify-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn(
        sliderTrackVariants({ variant }),
        "relative grow overflow-hidden rounded-full",
        "data-[orientation='horizontal']:h-2 data-[orientation='horizontal']:w-full",
        "data-[orientation='vertical']:h-full data-[orientation='vertical']:w-2",
      )}
    >
      <SliderPrimitive.Range
        className={cn(
          sliderRangeVariants({ variant }),
          "absolute",
          "data-[orientation='horizontal']:h-full",
          "data-[orientation='vertical']:w-full",
        )}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        sliderThumbVariants({ variant }),
        "block h-5 w-5 rounded-full border-2 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
