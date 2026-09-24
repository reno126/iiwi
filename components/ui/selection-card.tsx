import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";

interface SelectionCardProps {
  media?: React.ReactNode;
  title: React.ReactNode;
  badge?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: "default" | "primary";
  className?: string;
  children?: React.ReactNode;
}

export function SelectionCard({
  media,
  title,
  badge,
  description,
  actions,
  variant = "default",
  className,
  children,
}: SelectionCardProps) {
  const variantClasses = {
    default: "border bg-card text-card-foreground shadow-2xs",
    primary: "border-primary/40 bg-primary/5 text-card-foreground shadow-xs",
  };

  return (
    <Card className={cn("transition-all", variantClasses[variant], className)}>
      <CardContent className="flex flex-col justify-between gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
        <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
          {media}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {typeof title === "string" ? (
                <span className="truncate font-semibold text-foreground">
                  {title}
                </span>
              ) : (
                title
              )}
              {badge}
            </div>
            {description && (
              <div className="truncate text-xs text-muted-foreground">
                {description}
              </div>
            )}
            {children}
          </div>
        </div>

        {actions && (
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
