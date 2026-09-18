import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { productGetById } from "@/serverActions/productGetById";
import { ProductDetails } from "./_components/ProductDetails";
import { ProductDetailsSkeleton } from "./_components/ProductDetailsSkeleton";
import { buildProductDetailSchema } from "@/lib/seo/schemaMarkup";
import { buildProductMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await productGetById(id);
  return buildProductMetadata(product);
}

interface ProductDetailsSectionProps {
  id: string;
}

async function ProductDetailsSection({ id }: ProductDetailsSectionProps) {
  const product = await productGetById(id);

  if (!product) {
    notFound();
  }

  const jsonLd = buildProductDetailSchema(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetails product={product} />
    </>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<ProductDetailsSkeleton />}>
      <ProductDetailsSection id={id} />
    </Suspense>
  );
}
