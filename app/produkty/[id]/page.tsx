import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { productGetById } from "@/serverActions/productGetById";
import { ProductDetails } from "./_components/ProductDetails";
import { ProductDetailsSkeleton } from "./_components/ProductDetailsSkeleton";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await productGetById(id);

  if (!product) {
    return {
      title: "Produkt nie znaleziony | TrueReview",
      description: "Szukany produkt nie istnieje w bazie danych TrueReview.",
    };
  }

  return {
    title: `${product.name} - Opinie | TrueReview`,
    description: `Sprawdź recenzje i opinie o produkcie ${product.name} w serwisie TrueReview.`,
  };
}

interface ProductDetailsSectionProps {
  id: string;
}

async function ProductDetailsSection({ id }: ProductDetailsSectionProps) {
  const product = await productGetById(id);

  if (!product) {
    notFound();
  }

  return <ProductDetails product={product} />;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<ProductDetailsSkeleton />}>
      <ProductDetailsSection id={id} />
    </Suspense>
  );
}
