import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-ig-subtle px-2.5 py-0.5",
        "text-xs font-medium text-ig-secondary dark:bg-white/10 dark:text-white",
        className
      )}
      {...props}
    />
  );
}
