import * as React from "react";
import { cn } from "cn";

interface DividedListItemProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
  children?: React.ReactNode;
}

export function DividedListItem({
  left,
  right,
  className,
  leftClassName,
  rightClassName,
  children,
}: DividedListItemProps) {
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border/60 pb-2 text-sm last:border-b-0 last:pb-0",
        className,
      )}
    >
      {left && (
        <div
          className={cn(
            "flex min-w-0 items-center gap-2 truncate",
            leftClassName,
          )}
        >
          {left}
        </div>
      )}
      {right && (
        <div
          className={cn(
            "flex shrink-0 items-center gap-1 text-xs text-muted-foreground sm:text-sm",
            rightClassName,
          )}
        >
          {right}
        </div>
      )}
      {children}
    </li>
  );
}
