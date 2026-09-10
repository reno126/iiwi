import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { recentReviewsGet } from "@/serverActions/recentReviewsGet";
import { shopsGet } from "@/serverActions/shopsGet";
import { RecentReviewsBanner } from "./_components/RecentReviewsBanner";
import { ShopsGrid } from "./_components/ShopsGrid";

export const metadata: Metadata = {
  title: "Strona główna | TrueReview",
  description: "Tylko tutaj znajdzie prawdziwe, całkowicie niezależne opinie o produktach.",
};

export default async function HomePage() {
  const [recentReviews, shops] = await Promise.all([
    recentReviewsGet(3),
    shopsGet(),
  ]);

  return (
    <div className="flex flex-col gap-10 sm:gap-14 md:gap-16 w-full max-w-5xl mx-auto py-4 sm:py-8">
      {/* 1. Big Text Hero */}
      <section className="text-center py-4 sm:py-8 md:py-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
          Tylko tutaj znajdzie prawdziwe, całkowicie niezależne opinie o produktach
        </h1>
      </section>

      {/* 2. Section without title with 2 buttons: "Zobacz wszystkie opinie" "Dodaj opinię" */}
      <section className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md mx-auto">
        <Link
          href="/produkty"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full sm:w-auto font-semibold shadow-xs text-center",
          )}
        >
          Zobacz wszystkie opinie
        </Link>
        <Link
          href="/opinie/dodaj"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full sm:w-auto font-semibold shadow-xs text-center",
          )}
        >
          Dodaj opinię
        </Link>
      </section>

      {/* 3. Banner with 3 static, latest reviews: "Ostatnio dodane opinie" */}
      <section className="w-full space-y-6">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Ostatnio dodane opinie
          </h2>
        </div>
        <RecentReviewsBanner reviews={recentReviews} />
      </section>

      {/* 4. Shops grid: "Opinie z dowolnych sklepów stacjonarnych i internetowych", "Popularne sklepy" */}
      <section className="w-full space-y-6">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Opinie z dowolnych sklepów stacjonarnych i internetowych
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Popularne sklepy
          </p>
        </div>
        <ShopsGrid shops={shops} />
      </section>

      {/* 5. Section without title with 1 button: "Dodaj opinię" */}
      <section className="flex justify-center w-full py-2 sm:py-4">
        <Link
          href="/opinie/dodaj"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full sm:w-auto font-semibold px-8 shadow-xs text-center",
          )}
        >
          Dodaj opinię
        </Link>
      </section>
    </div>
  );
}
