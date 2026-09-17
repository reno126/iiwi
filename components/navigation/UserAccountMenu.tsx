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
        render={
          <button
            type="button"
            className={cn(
              "relative flex size-9 items-center justify-center rounded-full ring-2 ring-transparent transition-all hover:ring-primary/20 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer",
              className,
            )}
            aria-label={USER_ACCOUNT_MESSAGES.userMenuAriaLabel}
          />
        }
      >
        <Avatar size="default" className="size-9">
          {userImage && (
            <AvatarImage src={userImage} alt={userName || user || "Avatar"} />
          )}
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {userInitial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="w-56 p-1.5 shadow-lg border">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal px-2 py-2">
            <div className="flex flex-col space-y-1">
              {userName && (
                <p className="text-sm font-semibold leading-none text-foreground truncate">
                  {userName}
                </p>
              )}
              <p className="text-xs leading-none text-muted-foreground truncate">
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
              className="flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-accent"
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
              className="flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-accent"
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
          className="flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-destructive/10 text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="size-4 text-destructive" />
          <span>{USER_ACCOUNT_MESSAGES.signOutAction}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
