"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { DesktopNav, MenuItem, type NavItem } from "./DesktopNav";

const MobileNavDrawer = dynamic(
  () => import("./MobileNavDrawer").then((mod) => mod.MobileNavDrawer),
  { ssr: true },
);

export const TOP_MENU_ITEMS: NavItem[] = [
  { title: "Strona główna", href: "/" },
  { title: "Produkty", href: "/produkty" },
  { title: "Panel", href: "/dashboard" },
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
    <nav aria-label="Główna nawigacja">
      <DesktopNav items={TOP_MENU_ITEMS} user={user} />
      <MobileNavDrawer
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        items={TOP_MENU_ITEMS}
        user={user}
        userName={userName}
        userImage={userImage}
      />
    </nav>
  );
}
