import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "../_components/ProductForm";

export const metadata: Metadata = {
  title: "New Product | TrueReview",
  description: "Create a new product to review",
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
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Create New Product
        </h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details below to add a new product.
        </p>
      </div>

      <ProductForm />
    </div>
  );
}

export default NewProductPage;
