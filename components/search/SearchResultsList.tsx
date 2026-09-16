import * as React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "cn";

interface SearchResultsListProps<T> {
  results: T[];
  listboxId: string;
  resultsAriaLabel: string;
  highlightedIndex: number;
  onSelect: (item: T) => void;
  onHighlight: (index: number) => void;
  getKey?: (item: T, index: number) => string | number;
  getItemLabel?: (item: T) => string;
  renderItem?: (
    item: T,
    isHighlighted: boolean,
    index: number,
  ) => React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

function defaultItemLabel<T>(item: T): string {
  if (item === null || item === undefined) return "";
  if (
    typeof item === "string" ||
    typeof item === "number" ||
    typeof item === "boolean"
  ) {
    return String(item);
  }
  if (typeof item === "object") {
    const record = item as Record<string, unknown>;
    if (typeof record.name === "string") return record.name;
    if (typeof record.title === "string") return record.title;
    if (typeof record.label === "string") return record.label;
    if (typeof record.description === "string") return record.description;
  }
  return String(item);
}

export function SearchResultsList<T>({
  results,
  listboxId,
  resultsAriaLabel,
  highlightedIndex,
  onSelect,
  onHighlight,
  getKey,
  getItemLabel,
  renderItem,
  isLoading = false,
  className,
}: SearchResultsListProps<T>) {
  return (
    <Card
      className={cn(
        "border shadow-xs overflow-hidden",
        isLoading && "opacity-75 transition-opacity",
      )}
      data-slot="search-results"
    >
      <ScrollArea className={cn("max-h-72", className)}>
        <div
          id={listboxId}
          role="listbox"
          aria-label={resultsAriaLabel}
          className="p-1 space-y-0.5"
        >
          {results.map((item, index) => {
            const isHighlighted = highlightedIndex === index;
            const key = getKey
              ? getKey(item, index)
              : ((item as Record<string, unknown>)?.id ??
                (item as Record<string, unknown>)?.key ??
                index);

            return (
              <div
                key={String(key)}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={isHighlighted}
                tabIndex={-1}
                onClick={() => onSelect(item)}
                onMouseEnter={() => onHighlight(index)}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-md cursor-pointer select-none transition-colors outline-none",
                  isHighlighted
                    ? "bg-accent text-accent-foreground font-medium"
                    : "hover:bg-muted/60 text-foreground",
                )}
              >
                {renderItem ? (
                  renderItem(item, isHighlighted, index)
                ) : (
                  <span className="truncate">
                    {getItemLabel
                      ? getItemLabel(item)
                      : defaultItemLabel(item)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
