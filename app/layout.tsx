import type { Metadata } from "next";
import "./globals.css";
import { ClientSessionProvider } from "@/providers/ClientSessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { TopMenu } from "@/components/navigation/TopMenu";

export const metadata: Metadata = {
  title: "Is it worth it? :: Beta version",
  description: "Albo nawet pre beta...",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ClientSessionProvider session={session}>
          <TopMenu />
          {children}
        </ClientSessionProvider>
      </body>
    </html>
  );
}
