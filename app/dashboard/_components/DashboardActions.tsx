"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { PlusCircle, LogOut } from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "cn";
import { DASHBOARD_MESSAGES } from "@/app/dashboard/constants";

export function DashboardActions() {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-md border-t border-border z-40 flex items-center gap-3 shadow-lg sm:static sm:p-0 sm:bg-transparent sm:border-0 sm:shadow-none sm:justify-start">
      <Link
        href="/opinie/dodaj"
        className={cn(
          buttonVariants(),
          "flex-1 sm:flex-initial gap-1.5 font-medium justify-center",
        )}
      >
        <PlusCircle className="size-4" />
        <span>{DASHBOARD_MESSAGES.addReviewButton}</span>
      </Link>

      <Button
        type="button"
        variant="outline"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex-1 sm:flex-initial gap-1.5 font-medium text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer justify-center"
      >
        <LogOut className="size-4 text-destructive" />
        <span>{DASHBOARD_MESSAGES.signOutButton}</span>
      </Button>
    </div>
  );
}
