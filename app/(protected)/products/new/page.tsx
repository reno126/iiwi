import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "../_components/ProductForm";

export const metadata: Metadata = {
  title: "Nowy produkt | TrueReview",
  description: "Utwórz nowy produkt do recenzji",
};

interface NewProductPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export function NewProductPage({}: NewProductPageProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="mr-1 size-4" />
          Wróć do panelu
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Utwórz nowy produkt
        </h1>
        <p className="text-sm text-muted-foreground">
          Wypełnij poniższe dane, aby dodać nowy produkt.
        </p>
      </div>

      <ProductForm />
    </div>
  );
}

export default NewProductPage;
