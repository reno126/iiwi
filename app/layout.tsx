import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { ClientSessionProvider } from "@/providers/ClientSessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { TopMenu } from "@/components/navigation/TopMenu";
import { BrandLogo } from "@/components/BrandLogo";
import localFont from "next/font/local";
import { cn } from "cn";
import { buildWebSiteSchema } from "@/lib/seo/schemaMarkup";
import { buildRootMetadata } from "@/lib/seo/metadata";
import { serializeJsonLd } from "@/lib/seo/serializeJsonLd";

const plusJakartaSans = localFont({
  src: "./fonts/PlusJakartaSans-Variable.woff2",
  variable: "--font-sans",
  weight: "400 800",
  style: "normal",
  display: "swap",
});

const newsreader = localFont({
  src: "./fonts/Newsreader-Variable.woff2",
  variable: "--font-heading",
  weight: "400 700",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Times New Roman",
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
      className={cn(
        "h-full antialiased",
        "font-sans",
        plusJakartaSans.variable,
        newsreader.variable,
      )}
    >
      <body className="flex min-h-full flex-col overflow-x-clip bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(webSiteJsonLd) }}
        />
        <ClientSessionProvider session={session}>
          <header className="sticky top-0 z-50 border-b border-border/70 bg-card/90 shadow-xs backdrop-blur-xs">
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
          <footer className="mt-auto w-full border-t border-border bg-stone-900 px-4 py-6 text-stone-300 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center text-xs font-medium sm:flex-row sm:text-sm">
              <span>
                Darmowy serwis z rzetelnymi opiniami o produktach z dowolnych
                sklepów.
              </span>
              <span className="text-stone-400">
                TrueReview &copy; {new Date().getFullYear()}
              </span>
            </div>
          </footer>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
