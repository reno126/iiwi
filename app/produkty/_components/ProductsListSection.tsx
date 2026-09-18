import { productsGet } from "@/serverActions/productsGet";
import { ProductsList } from "./ProductsList";
import { ProductsPagination } from "./ProductsPagination";

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

  return (
    <div className="space-y-6">
      <ProductsList products={products} />
      <ProductsPagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
