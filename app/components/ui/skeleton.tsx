import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  loading?: boolean;
  as?: "div" | "span" | React.ElementType;
}

function Skeleton({
  className,
  asChild = false,
  loading = true,
  as: Component = "div",
  children,
  ...props
}: SkeletonProps) {
  if (!loading) {
    if (asChild) {
      return <Slot {...props}>{children}</Slot>;
    }
    return <>{children}</>;
  }

  const Comp = asChild ? Slot : Component;

  return (
    <Comp
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-surface-3/80 dark:bg-surface-3/60",
        children ? "relative select-none pointer-events-none" : "",
        className
      )}
      {...props}
    >
      {children ? <span className="invisible">{children}</span> : null}
    </Comp>
  );
}

export { Skeleton };
