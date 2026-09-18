import { productsGet } from "@/serverActions/productsGet";
import { ProductsList } from "./ProductsList";
import { ProductsPagination } from "./ProductsPagination";
import { buildProductsCatalogSchema } from "@/lib/seo/schemaMarkup";

interface ProductsListSectionProps {
  page?: number;
}

export async function ProductsListSection({
  page = 1,
}: ProductsListSectionProps) {
  const { products, totalPages, currentPage } = await productsGet({
    page,
    pageSize: 10,
  });

  const jsonLd = buildProductsCatalogSchema(products, currentPage);

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductsList products={products} />
      <ProductsPagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
