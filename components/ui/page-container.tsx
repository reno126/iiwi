import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

export const pageContainerVariants = cva("mx-auto w-full", {
  variants: {
    size: {
      default: "flex max-w-4xl flex-col gap-6 py-4",
      sm: "flex max-w-2xl flex-col gap-6",
      md: "flex max-w-3xl flex-col gap-6 py-4 pb-28 sm:pb-8",
      lg: "flex max-w-4xl flex-col gap-6 py-4",
      xl: "flex max-w-5xl flex-col gap-10 py-4 sm:gap-14 sm:py-8 md:gap-16",
      auth: "flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface PageContainerProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof pageContainerVariants> {
  children?: React.ReactNode;
}

export function PageContainer({
  size,
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      data-slot="page-container"
      data-size={size ?? "default"}
      className={cn(pageContainerVariants({ size }), className)}
      {...props}
    >
      {children}
    </div>
  );
}
