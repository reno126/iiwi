import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "cn";

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
        success:
          "border-emerald-500/30 bg-emerald-50/70 text-emerald-900 *:data-[slot=alert-description]:text-emerald-800/90 dark:bg-emerald-950/20 dark:text-emerald-300 dark:*:data-[slot=alert-description]:text-emerald-300/90 *:[svg]:text-emerald-600 dark:*:[svg]:text-emerald-400",
        warning:
          "border-amber-500/30 bg-amber-50/70 text-amber-900 *:data-[slot=alert-description]:text-amber-800/90 dark:bg-amber-950/20 dark:text-amber-300 dark:*:data-[slot=alert-description]:text-amber-300/90 *:[svg]:text-amber-600 dark:*:[svg]:text-amber-400",
        info: "border-blue-500/30 bg-blue-50/70 text-blue-900 *:data-[slot=alert-description]:text-blue-800/90 dark:bg-blue-950/20 dark:text-blue-300 dark:*:data-[slot=alert-description]:text-blue-300/90 *:[svg]:text-blue-600 dark:*:[svg]:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2.5 right-3", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
