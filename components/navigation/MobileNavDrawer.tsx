"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { SignOut } from "../auth/SignOut";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "cn";
import type { NavItem } from "./DesktopNav";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  items: NavItem[];
  user?: string | null;
  userName?: string | null;
  userImage?: string | null;
}

export function MobileNavDrawer({
  isOpen,
  onOpenChange,
  items,
  user,
  userName,
  userImage,
}: MobileNavDrawerProps) {
  const userInitial = (userName || user || "U").charAt(0).toUpperCase();

  return (
    <div className="flex md:hidden">
      <Drawer
        open={isOpen}
        onOpenChange={onOpenChange}
        showSwipeHandle
        swipeDirection="down"
      >
        <DrawerTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-700"
              aria-label="Otwórz menu nawigacji"
            />
          }
        >
          <Menu className="size-5" />
        </DrawerTrigger>

        <DrawerContent className="p-6 flex flex-col justify-between max-h-[85vh]">
          <div className="space-y-6">
            <DrawerHeader className="p-0 text-left">
              <DrawerTitle className="text-lg font-bold text-foreground">
                Menu
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                Nawigacja mobilna serwisu
              </DrawerDescription>
            </DrawerHeader>

            <nav className="flex flex-col space-y-1">
              {items.map((item) => (
                <DrawerClose
                  key={item.href}
                  render={
                    <Link
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className="px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:bg-muted hover:text-foreground transition-colors"
                    />
                  }
                >
                  {item.title}
                </DrawerClose>
              ))}
            </nav>
          </div>

          <div className="space-y-4 pt-4">
            <Separator />
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar size="default">
                    {userImage && <AvatarImage src={userImage} alt={userName || user} />}
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                  <div className="text-xs text-muted-foreground truncate">
                    Zalogowano jako:{" "}
                    <span className="font-semibold text-foreground block truncate">
                      {user}
                    </span>
                  </div>
                </div>
                <SignOut className="w-full justify-center" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <DrawerClose
                  render={
                    <Link
                      href="/login"
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "touch" }),
                        "w-full justify-center",
                      )}
                    />
                  }
                >
                  Zaloguj się
                </DrawerClose>
                <DrawerClose
                  render={
                    <Link
                      href="/register"
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        buttonVariants({ variant: "default", size: "touch" }),
                        "w-full justify-center",
                      )}
                    />
                  }
                >
                  Zarejestruj się
                </DrawerClose>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
