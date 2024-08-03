import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

const linkVariants = cva("cursor-pointer");

export interface LinkProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof linkVariants> {
  href: string;
}

const Link = React.forwardRef<HTMLDivElement, LinkProps>(
  ({ className, href, ...props }, ref) => {
    return (
      <a href={href}>
        <div ref={ref} className={cn(linkVariants({ className }))} {...props} />
      </a>
    );
  },
);
Link.displayName = "Link";

export { Link, linkVariants };
