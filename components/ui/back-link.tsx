import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export interface BackLinkProps
  extends Omit<React.ComponentProps<typeof Link>, "className"> {
  className?: string;
  children: React.ReactNode;
}

export function BackLink({
  href,
  className,
  children,
  ...props
}: BackLinkProps) {
  return (
    <Link
      href={href}
      data-slot="back-link"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "-ml-2 gap-1.5 text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      <ChevronLeft className="size-4" />
      {children}
    </Link>
  );
}

export interface BackButtonProps extends React.ComponentProps<"button"> {
  children: React.ReactNode;
}

export function BackButton({ className, children, ...props }: BackButtonProps) {
  return (
    <button
      type="button"
      data-slot="back-button"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "-ml-2 gap-1.5 text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      <ChevronLeft className="size-4" />
      {children}
    </button>
  );
}
