"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LayoutDashboard, MessageSquarePlus, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";

export const USER_ACCOUNT_MESSAGES = {
  userMenuAriaLabel: "Menu profilu użytkownika",
  dashboardLink: "Panel użytkownika",
  addReviewLink: "Dodaj opinię",
  signOutAction: "Wyloguj się",
} as const;

export interface UserAccountMenuProps {
  user?: string | null;
  userName?: string | null;
  userImage?: string | null;
  className?: string;
  align?: "start" | "end" | "center";
}

export function UserAccountMenu({
  user,
  userName,
  userImage,
  className,
  align = "end",
}: UserAccountMenuProps) {
  const userInitial = (userName || user || "U").charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "relative flex size-9 cursor-pointer items-center justify-center rounded-full ring-2 ring-transparent transition-all hover:ring-primary/20 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
          className,
        )}
        aria-label={USER_ACCOUNT_MESSAGES.userMenuAriaLabel}
      >
        <Avatar size="default" className="size-9">
          {userImage && (
            <AvatarImage src={userImage} alt={userName || user || "Avatar"} />
          )}
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {userInitial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="w-56 border p-1.5 shadow-lg"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2 font-normal">
            <div className="flex flex-col space-y-1">
              {userName && (
                <p className="truncate text-sm leading-none font-semibold text-foreground">
                  {userName}
                </p>
              )}
              <p className="truncate text-xs leading-none text-muted-foreground">
                {user}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link
              href="/dashboard"
              className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            />
          }
        >
          <LayoutDashboard className="size-4 text-muted-foreground" />
          <span>{USER_ACCOUNT_MESSAGES.dashboardLink}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <Link
              href="/opinie/dodaj"
              className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            />
          }
        >
          <MessageSquarePlus className="size-4 text-muted-foreground" />
          <span>{USER_ACCOUNT_MESSAGES.addReviewLink}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="size-4 text-destructive" />
          <span>{USER_ACCOUNT_MESSAGES.signOutAction}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
