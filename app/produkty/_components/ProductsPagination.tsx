import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { generatePaginationPages } from "@/lib/pagination";
import { cn } from "cn";

export const PAGINATION_MESSAGES = {
  navAriaLabel: "Nawigacja stronami",
  previousPageAriaLabel: "Przejdź do poprzedniej strony",
  nextPageAriaLabel: "Przejdź do następnej strony",
  previousButton: "Poprzednia",
  nextButton: "Następna",
} as const;

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

  const pages = generatePaginationPages(currentPage, totalPages);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label={PAGINATION_MESSAGES.navAriaLabel}
      className="flex items-center justify-center gap-1.5 pt-6 pb-2"
    >
      {hasPrevious ? (
        <Link
          href={`/produkty?page=${currentPage - 1}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1 px-3 font-medium",
          )}
          aria-label={PAGINATION_MESSAGES.previousPageAriaLabel}
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">
            {PAGINATION_MESSAGES.previousButton}
          </span>
        </Link>
      ) : (
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "pointer-events-none gap-1 px-3 text-muted-foreground opacity-50",
          )}
          aria-disabled="true"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">
            {PAGINATION_MESSAGES.previousButton}
          </span>
        </span>
      )}

      <div className="mx-1 flex items-center gap-1">
        {pages.map((pageItem, pageIndex) => {
          if (pageItem === "ellipsis") {
            return (
              <span
                key={`ellipsis-${pageIndex}`}
                className="px-2 text-sm text-muted-foreground select-none"
              >
                …
              </span>
            );
          }

          const isCurrent = pageItem === currentPage;

          return (
            <Link
              key={pageItem}
              href={`/produkty?page=${pageItem}`}
              className={cn(
                buttonVariants({
                  variant: isCurrent ? "default" : "outline",
                  size: "sm",
                }),
                "h-8 w-8 p-0 font-medium",
                isCurrent && "pointer-events-none",
              )}
              aria-current={isCurrent ? "page" : undefined}
            >
              {pageItem}
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
          aria-label={PAGINATION_MESSAGES.nextPageAriaLabel}
        >
          <span className="hidden sm:inline">
            {PAGINATION_MESSAGES.nextButton}
          </span>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "pointer-events-none gap-1 px-3 text-muted-foreground opacity-50",
          )}
          aria-disabled="true"
        >
          <span className="hidden sm:inline">
            {PAGINATION_MESSAGES.nextButton}
          </span>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
