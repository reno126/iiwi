import * as React from "react";
import { cn } from "cn";

interface PropertyRowProps {
  label?: React.ReactNode;
  value?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  semantic?: "dl" | "div";
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  children?: React.ReactNode;
}

export function PropertyRow({
  label,
  value,
  icon: IconComponent,
  iconClassName,
  semantic = "div",
  className,
  labelClassName,
  valueClassName,
  children,
}: PropertyRowProps) {
  const renderedIcon = IconComponent ? (
    <IconComponent
      className={cn("size-3.5 shrink-0 text-muted-foreground", iconClassName)}
    />
  ) : null;

  if (semantic === "dl") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        {label && (
          <dt className={cn("font-medium text-foreground", labelClassName)}>
            {label}
          </dt>
        )}
        <dd
          className={cn(
            "flex items-center gap-1 text-foreground",
            valueClassName,
          )}
        >
          {renderedIcon}
          {value}
          {children}
        </dd>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {renderedIcon}
      <span className={cn("truncate", valueClassName)}>
        {label && (
          <span className={cn("mr-1 text-muted-foreground", labelClassName)}>
            {label}
          </span>
        )}
        {value}
        {children}
      </span>
    </div>
  );
}
