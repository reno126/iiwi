import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { RecentReviewsSection } from "./_components/RecentReviewsSection";
import { RecentReviewsSkeleton } from "./_components/RecentReviewsSkeleton";
import { ShopsSection } from "./_components/ShopsSection";
import { ShopsSkeleton } from "./_components/ShopsSkeleton";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Prawdziwe, niezależne opinie o produktach",
  description:
    "Tylko tutaj znajdziesz prawdziwe, całkowicie niezależne opinie o produktach.",
  path: "/",
});

export const HOME_MESSAGES = {
  heroHeading: "Tylko tutaj znajdziesz prawdziwe, całkowicie niezależne opinie o produktach",
  viewAllReviewsLink: "Zobacz wszystkie opinie",
  addReviewLink: "Dodaj opinię",
  recentReviewsHeading: "Ostatnio dodane opinie",
  shopsHeading: "Opinie z dowolnych sklepów stacjonarnych i internetowych",
  popularShopsSubheading: "Popularne sklepy",
} as const;

export const revalidate = 60;

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10 sm:gap-14 md:gap-16 w-full max-w-5xl mx-auto py-4 sm:py-8">
      <section className="text-center py-4 sm:py-8 md:py-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-muted-foreground max-w-4xl mx-auto leading-tight">
          Tylko tutaj znajdziesz{" "}
          <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground">
            prawdziwe
          </span>
          , całkowicie niezależne{" "}
          <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground">
            opinie
          </span>{" "}
          o produktach
        </h1>
      </section>

      <section className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md mx-auto">
        <Link
          href="/produkty"
          className={cn(
            buttonVariants({ size: "lg", variant: "outline" }),
            "w-full sm:w-auto font-semibold shadow-xs text-center",
          )}
        >
          {HOME_MESSAGES.viewAllReviewsLink}
        </Link>
        <Link
          href="/opinie/dodaj"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full sm:w-auto font-semibold shadow-xs text-center",
          )}
        >
          {HOME_MESSAGES.addReviewLink}
        </Link>
      </section>

      <section className="w-full space-y-6">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {HOME_MESSAGES.recentReviewsHeading}
          </h2>
        </div>
        <Suspense fallback={<RecentReviewsSkeleton />}>
          <RecentReviewsSection />
        </Suspense>
      </section>

      <section className="w-full space-y-6">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {HOME_MESSAGES.shopsHeading}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            {HOME_MESSAGES.popularShopsSubheading}
          </p>
        </div>
        <Suspense fallback={<ShopsSkeleton />}>
          <ShopsSection />
        </Suspense>
      </section>

      <section className="flex justify-center w-full py-2 sm:py-4">
        <Link
          href="/opinie/dodaj"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full sm:w-auto font-semibold px-8 shadow-xs text-center",
          )}
        >
          {HOME_MESSAGES.addReviewLink}
        </Link>
      </section>
    </div>
  );
}
