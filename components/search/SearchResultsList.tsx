import * as React from "react";
import { memo } from "react";
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

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
  if (isRecordObject(item)) {
    if (typeof item.name === "string") return item.name;
    if (typeof item.title === "string") return item.title;
    if (typeof item.label === "string") return item.label;
    if (typeof item.description === "string") return item.description;
  }
  return String(item);
}

function SearchResultsListInternal<T>({
  results,
  listboxId,
  resultsAriaLabel,
  highlightedIndex,
  onSelect,
  onHighlight,
  getKey,
  getItemLabel,
  renderItem,
  className,
}: SearchResultsListProps<T>) {
  return (
    <Card
      className={cn(
        "p-1 shadow-md border overflow-hidden max-h-72",
        className,
      )}
    >
      <ScrollArea className="max-h-70 overflow-y-auto">
        <div
          id={listboxId}
          role="listbox"
          aria-label={resultsAriaLabel}
          className="flex flex-col gap-0.5 p-1"
        >
          {results.map((item, index) => {
            const key = getKey ? getKey(item, index) : index;
            const isHighlighted = highlightedIndex === index;

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

const genericMemo: <ComponentType>(component: ComponentType) => ComponentType = memo;
const MemoizedSearchResultsList = genericMemo(SearchResultsListInternal);

export function SearchResultsList<T>(props: SearchResultsListProps<T>) {
  return <MemoizedSearchResultsList {...props} />;
}
