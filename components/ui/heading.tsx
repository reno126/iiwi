import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

export const headingVariants = cva("font-bold tracking-tight text-foreground", {
  variants: {
    size: {
      hero: "text-3xl font-extrabold sm:text-4xl md:text-5xl lg:text-6xl",
      "3xl": "text-2xl font-bold sm:text-3xl",
      "2xl": "text-xl font-bold sm:text-2xl",
      xl: "text-lg font-semibold sm:text-xl",
      lg: "text-base font-semibold sm:text-lg",
      base: "text-base font-semibold",
    },
  },
  defaultVariants: {
    size: "2xl",
  },
});

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "span"
  | "div"
  | "p";

export interface HeadingProps
  extends React.ComponentProps<"h1">,
    VariantProps<typeof headingVariants> {
  level?: HeadingLevel;
  as?: HeadingElement;
}

function resolveDefaultSize(
  level: HeadingLevel,
): NonNullable<VariantProps<typeof headingVariants>["size"]> {
  if (level === 1) return "3xl";
  if (level === 2) return "2xl";
  if (level === 3) return "xl";
  if (level === 4) return "lg";
  return "base";
}

export function Heading({
  level = 2,
  as,
  size,
  className,
  children,
  ...props
}: HeadingProps) {
  const Component = as ?? (`h${level}` as const);
  const resolvedSize = size ?? resolveDefaultSize(level);

  return (
    <Component
      data-slot="heading"
      data-level={level}
      className={cn(headingVariants({ size: resolvedSize }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export const headingDescriptionVariants = cva("text-muted-foreground", {
  variants: {
    size: {
      default: "text-sm sm:text-base",
      sm: "text-sm",
      xs: "text-xs",
      lg: "text-base sm:text-lg",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface HeadingDescriptionProps
  extends React.ComponentProps<"p">,
    VariantProps<typeof headingDescriptionVariants> {
  children?: React.ReactNode;
}

export function HeadingDescription({
  size,
  className,
  ...props
}: HeadingDescriptionProps) {
  return (
    <p
      data-slot="heading-description"
      className={cn(headingDescriptionVariants({ size }), className)}
      {...props}
    />
  );
}

export const headingGroupVariants = cva("flex flex-col", {
  variants: {
    spacing: {
      tight: "gap-1",
      default: "gap-1.5",
      loose: "gap-2",
    },
    align: {
      left: "items-start text-left",
      center: "items-center text-center",
      right: "items-end text-right",
      responsive: "items-center text-center sm:items-start sm:text-left",
    },
  },
  defaultVariants: {
    spacing: "tight",
    align: "left",
  },
});

export interface HeadingGroupProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof headingGroupVariants> {
  children?: React.ReactNode;
}

export function HeadingGroup({
  spacing,
  align,
  className,
  ...props
}: HeadingGroupProps) {
  return (
    <div
      data-slot="heading-group"
      className={cn(headingGroupVariants({ spacing, align }), className)}
      {...props}
    />
  );
}
