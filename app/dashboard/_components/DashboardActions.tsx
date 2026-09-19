"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { PlusCircle, LogOut } from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "cn";
import { DASHBOARD_MESSAGES } from "@/app/dashboard/constants";

export function DashboardActions() {
  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 flex items-center gap-3 border-t border-border bg-background/95 p-3 shadow-lg backdrop-blur-md sm:static sm:justify-start sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
      <Link
        href="/opinie/dodaj"
        className={cn(
          buttonVariants(),
          "flex-1 justify-center gap-1.5 font-medium sm:flex-initial",
        )}
      >
        <PlusCircle className="size-4" />
        <span>{DASHBOARD_MESSAGES.addReviewButton}</span>
      </Link>

      <Button
        type="button"
        variant="outline"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex-1 cursor-pointer justify-center gap-1.5 font-medium text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-initial"
      >
        <LogOut className="size-4 text-destructive" />
        <span>{DASHBOARD_MESSAGES.signOutButton}</span>
      </Button>
    </div>
  );
}
