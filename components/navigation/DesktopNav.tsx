import { memo } from "react";
import Link from "next/link";
import { UserAccountMenu } from "./UserAccountMenu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export interface NavItem {
  title: string;
  href: string;
}

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

export const NAV_AUTH_MESSAGES = {
  loginLink: "Zaloguj się",
  registerLink: "Zarejestruj się",
} as const;

export interface DesktopNavProps {
  items: NavItem[];
  user?: string | null;
  userName?: string | null;
  userImage?: string | null;
}

const MemoizedDesktopNav = memo(function MemoizedDesktopNav({
  items,
  user,
  userName,
  userImage,
}: DesktopNavProps) {
  return (
    <ul className="hidden md:flex items-center space-x-6">
      {items.map((item) => (
        <li key={item.href}>
          <MenuItem title={item.title} href={item.href} />
        </li>
      ))}
      {user ? (
        <li>
          <UserAccountMenu
            user={user}
            userName={userName}
            userImage={userImage}
            align="end"
          />
        </li>
      ) : (
        <>
          <li>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {NAV_AUTH_MESSAGES.loginLink}
            </Link>
          </li>
          <li>
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {NAV_AUTH_MESSAGES.registerLink}
            </Link>
          </li>
        </>
      )}
    </ul>
  );
});

export function DesktopNav({
  items,
  user,
  userName,
  userImage,
}: DesktopNavProps) {
  return (
    <MemoizedDesktopNav
      items={items}
      user={user}
      userName={userName}
      userImage={userImage}
    />
  );
}
