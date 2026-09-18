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

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

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
    <html lang="pl" className={cn("h-full antialiased", "font-sans", inter.variable)}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 overflow-x-clip">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <ClientSessionProvider session={session}>
          <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
              <Link href="/" className="flex items-center shrink-0">
                <BrandLogo className="h-8 sm:h-9 w-auto" />
              </Link>
              <TopMenu />
            </div>
          </header>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="w-full bg-red-600 text-white py-4 px-4 sm:px-6 lg:px-8 mt-auto">
            <div className="max-w-7xl mx-auto text-center text-xs sm:text-sm font-medium">
              Darmowy serwis z rzetelnymi opiniami o produktach z dowolnych sklepów.
            </div>
          </footer>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
