import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import {
  Heading,
  HeadingDescription,
  HeadingGroup,
} from "@/components/ui/heading";
import { PageHeader, PageHeaderActions } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
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
    <PageContainer size="lg">
      <PageHeader bordered={true}>
        <HeadingGroup>
          <Heading level={1}>Produkty</Heading>
          <HeadingDescription>
            Przeglądaj wszystkie produkty i rzetelne opinie użytkowników
          </HeadingDescription>
        </HeadingGroup>

        <PageHeaderActions>
          <Link
            href="/opinie/dodaj"
            className={cn(buttonVariants(), "gap-1.5")}
          >
            <PlusCircle className="size-4" />
            Dodaj opinię
          </Link>
        </PageHeaderActions>
      </PageHeader>

      <Suspense key={page} fallback={<ProductsListSkeleton count={6} />}>
        <ProductsListSection page={page} />
      </Suspense>
    </PageContainer>
  );
}
