import * as React from "react";
import { cn } from "cn";

export interface PageHeaderProps extends React.ComponentProps<"header"> {
  bordered?: boolean;
}

export function PageHeader({
  bordered = false,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        bordered && "border-b border-border pb-6",
        className,
      )}
      {...props}
    >
      {children}
    </header>
  );
}

export interface PageHeaderActionsProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode;
}

export function PageHeaderActions({
  className,
  children,
  ...props
}: PageHeaderActionsProps) {
  return (
    <div
      data-slot="page-header-actions"
      className={cn(
        "flex shrink-0 items-center gap-2 self-start sm:self-center",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SectionHeaderProps extends React.ComponentProps<"div"> {
  bordered?: boolean;
}

export function SectionHeader({
  bordered = false,
  className,
  children,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
        bordered && "border-b border-border pb-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SectionHeaderActionsProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode;
}

export function SectionHeaderActions({
  className,
  children,
  ...props
}: SectionHeaderActionsProps) {
  return (
    <div
      data-slot="section-header-actions"
      className={cn(
        "flex shrink-0 items-center gap-2 self-start sm:self-center",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
