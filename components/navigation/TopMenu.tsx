"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { UserAccountMenu } from "./UserAccountMenu";
import { DesktopNav, MenuItem, NAV_AUTH_MESSAGES, type NavItem } from "./DesktopNav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

const MobileNavDrawer = dynamic(
  () => import("./MobileNavDrawer").then((mod) => mod.MobileNavDrawer),
  { ssr: true },
);

export const TOP_MENU_ITEMS: NavItem[] = [
  { title: "Produkty", href: "/produkty" },
  { title: "Dodaj opinię", href: "/opinie/dodaj" },
];

export { MenuItem };

export function TopMenu() {
  const { data: session } = useSession();
  const user = session?.user?.email;
  const userName = session?.user?.name;
  const userImage = session?.user?.image;
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return (
    <nav aria-label="Główna nawigacja" className="flex items-center">
      <DesktopNav
        items={TOP_MENU_ITEMS}
        user={user}
        userName={userName}
        userImage={userImage}
      />
      <div className="flex md:hidden items-center gap-2">
        {user ? (
          <UserAccountMenu
            user={user}
            userName={userName}
            userImage={userImage}
            align="end"
          />
        ) : (
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-xs font-semibold px-2 text-gray-700 hover:text-blue-600",
            )}
          >
            {NAV_AUTH_MESSAGES.loginLink}
          </Link>
        )}
        <MobileNavDrawer
          isOpen={isOpen}
          onOpenChange={handleOpenChange}
          items={TOP_MENU_ITEMS}
          user={user}
          userName={userName}
          userImage={userImage}
        />
      </div>
    </nav>
  );
}
