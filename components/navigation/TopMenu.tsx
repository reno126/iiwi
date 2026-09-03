"use client";

import Link from "next/link";
import { SignOut } from "../auth/SignOut";
import { useSession } from "next-auth/react";

const menuConfig = [
  { title: "Strona główna", href: "/" },
  { title: "Panel", href: "/dashboard" },
  { title: "Nowy produkt", href: "/products/new" },
];

interface MenuItemProps {
  title: string;
  href: string;
}

export function MenuItem({ title, href }: MenuItemProps) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
    >
      {title}
    </Link>
  );
}

export function TopMenu() {
  const { data: session } = useSession();
  const user = session?.user?.email;

  return (
    <nav aria-label="Główna nawigacja">
      <ul className="flex items-center space-x-6">
        {menuConfig.map((item) => (
          <li key={item.href}>
            <MenuItem title={item.title} href={item.href} />
          </li>
        ))}
        {user && (
          <li className="text-xs text-gray-500">
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
                className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
              >
                Zaloguj się
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Zarejestruj się
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
