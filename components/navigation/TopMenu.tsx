"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";

import { SignOut } from "../auth/SignOut";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/shadcn/utils";

const menuConfig = [
  { title: "Strona główna", href: "/" },
  { title: "Panel", href: "/dashboard" },
  { title: "Dodaj opinię", href: "/opinie/dodaj" },
];

interface MenuItemProps {
  title: string;
  href: string;
  onClick?: () => void;
  className?: string;
}

export function MenuItem({ title, href, onClick, className }: MenuItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "text-sm font-medium text-gray-700 transition-colors hover:text-blue-600",
        className,
      )}
    >
      {title}
    </Link>
  );
}

export function TopMenu() {
  const { data: session } = useSession();
  const user = session?.user?.email;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav aria-label="Główna nawigacja">
      {/* Menu desktopowe (widoczne od md: 768px w górę) */}
      <ul className="hidden md:flex items-center space-x-6">
        {menuConfig.map((item) => (
          <li key={item.href}>
            <MenuItem title={item.title} href={item.href} />
          </li>
        ))}
        {user && (
          <li className="text-xs text-gray-500 max-w-50 truncate">
            zalogowano jako:{" "}
            <span className="font-semibold text-gray-700">{user}</span>
          </li>
        )}
        {user && (
          <li>
            <SignOut />
          </li>
        )}
        {!user && (
          <>
            <li>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Zaloguj się
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Zarejestruj się
              </Link>
            </li>
          </>
        )}
      </ul>

      {/* Menu mobilne (widoczne poniżej md: 768px) */}
      <div className="flex md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger
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
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-70 sm:w-80 p-6 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <SheetHeader className="p-0 text-left">
                <SheetTitle className="text-lg font-bold text-foreground">
                  Menu
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Nawigacja mobilna serwisu
                </SheetDescription>
              </SheetHeader>

              <nav className="flex flex-col space-y-1">
                {menuConfig.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              {user ? (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground truncate">
                    Zalogowano jako:{" "}
                    <span className="font-semibold text-foreground block truncate">
                      {user}
                    </span>
                  </div>
                  <SignOut className="w-full justify-center" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full justify-center",
                    )}
                  >
                    Zaloguj się
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "w-full justify-center",
                    )}
                  >
                    Zarejestruj się
                  </Link>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
