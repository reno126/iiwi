import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { ClientSessionProvider } from "@/providers/ClientSessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { TopMenu } from "@/components/navigation/TopMenu";
import { BrandLogo } from "@/components/BrandLogo";
import { Inter } from "next/font/google";
import { cn } from "cn";
import { buildWebSiteSchema } from "@/lib/seo/schemaMarkup";
import { buildRootMetadata } from "@/lib/seo/metadata";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = buildRootMetadata();

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const session = await getServerSession(authOptions);
  const webSiteJsonLd = buildWebSiteSchema();

  return (
    <html
      lang="pl"
      className={cn("h-full antialiased", "font-sans", inter.variable)}
    >
      <body className="flex min-h-full flex-col overflow-x-clip bg-gray-50 text-gray-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <ClientSessionProvider session={session}>
          <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-xs">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link href="/" className="flex shrink-0 items-center">
                <BrandLogo className="h-8 w-auto sm:h-9" />
              </Link>
              <TopMenu />
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <footer className="mt-auto w-full bg-red-600 px-4 py-4 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl text-center text-xs font-medium sm:text-sm">
              Darmowy serwis z rzetelnymi opiniami o produktach z dowolnych
              sklepów.
            </div>
          </footer>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
