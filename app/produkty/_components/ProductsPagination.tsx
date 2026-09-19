import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { generatePaginationPages } from "@/lib/pagination";
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

  const pages = generatePaginationPages(currentPage, totalPages);
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
            "pointer-events-none gap-1 px-3 text-muted-foreground opacity-50",
          )}
          aria-disabled="true"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Poprzednia</span>
        </span>
      )}

      <div className="mx-1 flex items-center gap-1">
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
            "pointer-events-none gap-1 px-3 text-muted-foreground opacity-50",
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
