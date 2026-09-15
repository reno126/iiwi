import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function ProductsPagination({
  currentPage,
  totalPages,
}: ProductsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  // Generate page numbers with ellipsis if many pages
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

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
  };

  const pages = getPageNumbers();
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Nawigacja stronami"
      className="flex items-center justify-center gap-1.5 pt-6 pb-2"
    >
      {hasPrevious ? (
        <Link
          href={`/produkty?page=${currentPage - 1}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1 px-3 font-medium",
          )}
          aria-label="Przejdź do poprzedniej strony"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Poprzednia</span>
        </Link>
      ) : (
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1 px-3 opacity-50 pointer-events-none text-muted-foreground",
          )}
          aria-disabled="true"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Poprzednia</span>
        </span>
      )}

      <div className="flex items-center gap-1 mx-1">
        {pages.map((p, idx) => {
          if (p === "ellipsis") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-sm text-muted-foreground select-none"
              >
                …
              </span>
            );
          }

          const isCurrent = p === currentPage;

          return (
            <Link
              key={p}
              href={`/produkty?page=${p}`}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                buttonVariants({
                  variant: isCurrent ? "default" : "ghost",
                  size: "sm",
                }),
                "size-8 p-0 font-medium",
                isCurrent && "pointer-events-none font-semibold",
              )}
            >
              {p}
            </Link>
          );
        })}
      </div>

      {hasNext ? (
        <Link
          href={`/produkty?page=${currentPage + 1}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1 px-3 font-medium",
          )}
          aria-label="Przejdź do następnej strony"
        >
          <span className="hidden sm:inline">Następna</span>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1 px-3 opacity-50 pointer-events-none text-muted-foreground",
          )}
          aria-disabled="true"
        >
          <span className="hidden sm:inline">Następna</span>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
