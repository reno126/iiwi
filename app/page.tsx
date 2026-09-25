import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import {
  Heading,
  HeadingDescription,
  HeadingGroup,
} from "@/components/ui/heading";
import { PageContainer } from "@/components/ui/page-container";
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
  heroHeading:
    "Tylko tutaj znajdziesz prawdziwe, całkowicie niezależne opinie o produktach",
  viewAllReviewsLink: "Zobacz wszystkie opinie",
  addReviewLink: "Dodaj opinię",
  recentReviewsHeading: "Ostatnio dodane opinie",
  shopsHeading: "Opinie z dowolnych sklepów stacjonarnych i internetowych",
  popularShopsSubheading: "Popularne sklepy",
} as const;

export const revalidate = 60;

export default function HomePage() {
  return (
    <PageContainer size="xl">
      <section className="py-4 text-center sm:py-8 md:py-10">
        <Heading
          level={1}
          size="hero"
          className="mx-auto max-w-4xl text-2xl leading-tight font-bold tracking-tight text-balance text-foreground/85 sm:text-3xl md:text-4xl lg:text-5xl"
        >
          Tylko tutaj znajdziesz{" "}
          <span className="text-3xl font-extrabold text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
            prawdziwe
          </span>
          , całkowicie niezależne{" "}
          <span className="text-3xl font-extrabold text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
            opinie
          </span>{" "}
          o produktach
        </Heading>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <Link
          href="/produkty"
          className={cn(
            buttonVariants({ size: "lg", variant: "outline" }),
            "w-full text-center font-semibold shadow-xs sm:w-auto",
          )}
        >
          {HOME_MESSAGES.viewAllReviewsLink}
        </Link>
        <Link
          href="/opinie/dodaj"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full text-center font-semibold shadow-xs sm:w-auto",
          )}
        >
          {HOME_MESSAGES.addReviewLink}
        </Link>
      </section>

      <section className="w-full space-y-6">
        <Heading level={2} size="3xl" className="text-center sm:text-left">
          {HOME_MESSAGES.recentReviewsHeading}
        </Heading>
        <Suspense fallback={<RecentReviewsSkeleton />}>
          <RecentReviewsSection />
        </Suspense>
      </section>

      <section className="w-full space-y-6">
        <HeadingGroup align="responsive">
          <Heading level={2} size="3xl">
            {HOME_MESSAGES.shopsHeading}
          </Heading>
          <HeadingDescription>
            {HOME_MESSAGES.popularShopsSubheading}
          </HeadingDescription>
        </HeadingGroup>
        <Suspense fallback={<ShopsSkeleton />}>
          <ShopsSection />
        </Suspense>
      </section>

      <section className="flex w-full justify-center py-2 sm:py-4">
        <Link
          href="/opinie/dodaj"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full px-8 text-center font-semibold shadow-xs sm:w-auto",
          )}
        >
          {HOME_MESSAGES.addReviewLink}
        </Link>
      </section>
    </PageContainer>
  );
}
