"use client";

import Link from "next/link";
import { SignOut } from "../auth/SignOut";
import { useSession } from "next-auth/react";

const menuConfig = [
  { title: "Home", href: "/" },
  { title: "Dashboard", href: "/dashboard" },
  { title: "Test CRUD", href: "/test-crud" },
];

const MenuItem: React.FC<{ title: string; href: string }> = ({
  title,
  href,
}) => (
  <Link href={href} className="text-gray-700 hover:text-blue-600">
    {title}
  </Link>
);

export const TopMenu: React.FC = () => {
  const { data: session } = useSession();
  const user = session?.user?.email;
  return (
    <nav className="bg-white shadow-md p-4">
      <ul className="flex space-x-4">
        {menuConfig.map((item) => (
          <li key={item.href}>
            <MenuItem title={item.title} href={item.href} />
          </li>
        ))}
        {user && <div>logged in as: {user}</div>}
        {user && <SignOut />}
        {!user && (
          <li>
            <Link href="/login" className="text-gray-700 hover:text-blue-600">
              Sign In
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};
