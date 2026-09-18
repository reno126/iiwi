import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { ProductsListSection } from "./_components/ProductsListSection";
import { ProductsListSkeleton } from "./_components/ProductsListSkeleton";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Produkty",
  description:
    "Przeglądaj wszystkie produkty i rzetelne opinie użytkowników w serwisie TrueReview.",
  path: "/produkty",
});

export const revalidate = 60;

interface ProductsPageProps {
  searchParams?: Promise<{ page?: string }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams?.page;
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Produkty
          </h1>
          <p className="text-sm text-muted-foreground">
            Przeglądaj wszystkie produkty i rzetelne opinie użytkowników
          </p>
        </div>

        <Link
          href="/opinie/dodaj"
          className={cn(
            buttonVariants(),
            "shrink-0 gap-1.5 self-start sm:self-center",
          )}
        >
          <PlusCircle className="size-4" />
          Dodaj opinię
        </Link>
      </div>

      <Suspense key={page} fallback={<ProductsListSkeleton count={6} />}>
        <ProductsListSection page={page} />
      </Suspense>
    </div>
  );
}
