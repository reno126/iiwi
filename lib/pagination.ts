export type PaginationItem = number | "ellipsis";

export function generatePaginationPages(
  currentPage: number,
  totalPages: number,
  maxVisible = 5,
): PaginationItem[] {
  if (totalPages <= 0) return [];

  const pages: PaginationItem[] = [];

  if (totalPages <= maxVisible + 2) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) {
      pages.push("ellipsis");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push("ellipsis");
    }

    pages.push(totalPages);
  }

  return pages;
}
