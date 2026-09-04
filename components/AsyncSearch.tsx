"use client";

import * as React from "react";
import {
  useState,
  useDeferredValue,
  useEffect,
  useRef,
  useTransition,
  useId,
} from "react";
import { Search as SearchIcon, X, SearchX } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { cn } from "@/lib/shadcn/utils";

export interface AsyncSearchProps<T> {
  /**
   * Async server action or function called with the search query.
   * Resolves to an array of items or an object containing a `data` array.
   */
  searchAction: (
    query: string,
  ) => Promise<T[] | { data?: T[] | null } | null | undefined>;

  /**
   * Function to extract the text label of an item for default rendering and accessibility.
   */
  getItemLabel: (item: T) => string;

  /**
   * Callback invoked when a user clicks or selects a result item.
   */
  onResultSelect?: (item: T) => void;

  /**
   * Custom item renderer. Receives the item, whether it is highlighted, and its index.
   */
  renderItem?: (
    item: T,
    isHighlighted: boolean,
    index: number,
  ) => React.ReactNode;

  /**
   * Function to extract a unique key for each item in the results list.
   * Defaults to `item.id ?? item.key ?? index`.
   */
  getKey?: (item: T, index: number) => string | number;

  /**
   * Minimum number of characters required to trigger the search.
   * Defaults to 3.
   */
  minChars?: number;

  /**
   * Debounce delay in milliseconds before invoking `searchAction` with `deferredQuery`.
   * Defaults to 300ms.
   */
  debounceMs?: number;

  /**
   * Placeholder text for the search input.
   * Defaults to "Szukaj (min. 3 znaki)...".
   */
  placeholder?: string;

  /**
   * Placement of the results list: "inline" (default) or "dropdown" (absolute overlay).
   */
  resultsPlacement?: "inline" | "dropdown";

  /**
   * Custom component or content to display when no results are found.
   */
  emptyState?: React.ReactNode;

  /**
   * Title text for the default zero-result empty state.
   */
  emptyTitle?: string;

  /**
   * Description text for the default zero-result empty state.
   */
  emptyDescription?: string;

  /**
   * Custom loading component displayed below the input while searching.
   */
  loadingComponent?: React.ReactNode;

  /**
   * Whether to display a character count hint when `0 < query.length < minChars`.
   * Defaults to true.
   */
  showMinCharsHint?: boolean;

  /**
   * Whether to clear the search input upon selecting an item.
   * Defaults to false.
   */
  clearOnSelect?: boolean;

  /**
   * Custom class names for the root container.
   */
  className?: string;

  /**
   * Custom class names for the input element.
   */
  inputClassName?: string;

  /**
   * Custom class names for the results scroll area.
   */
  resultsClassName?: string;

  /**
   * Disabled state for the input.
   */
  disabled?: boolean;

  /**
   * Auto focus the input upon mount.
   */
  autoFocus?: boolean;

  /**
   * Initial search query.
   */
  defaultValue?: string;

  /**
   * Controlled query string.
   */
  value?: string;

  /**
   * Callback invoked whenever the input text changes.
   */
  onQueryChange?: (query: string) => void;
}

export function AsyncSearch<T>({
  searchAction,
  onResultSelect,
  renderItem,
  getKey,
  getItemLabel,
  minChars = 3,
  debounceMs = 300,
  placeholder = "Szukaj (min. 3 znaki)...",
  resultsPlacement = "inline",
  emptyState,
  emptyTitle = "Brak wyników",
  emptyDescription,
  loadingComponent,
  showMinCharsHint = true,
  clearOnSelect = false,
  className,
  inputClassName,
  resultsClassName,
  disabled = false,
  autoFocus = false,
  defaultValue = "",
  value,
  onQueryChange,
}: AsyncSearchProps<T>) {
  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState(defaultValue);
  const query = isControlled ? value : internalQuery;

  // React deferred value for non-blocking UI updates
  const deferredQuery = useDeferredValue(query);
  const isDeferredPending = query !== deferredQuery;

  // React 19 transition for async server action execution
  const [isActionPending, startTransition] = useTransition();

  const [rawResults, setRawResults] = useState<T[]>([]);
  const [rawHasSearched, setRawHasSearched] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const latestRequestIdRef = useRef(0);
  const listboxId = useId();

  const isLoading = isActionPending || isDeferredPending;
  const trimmedDeferred = deferredQuery.trim();
  const hasMinChars = trimmedDeferred.length >= minChars;

  // Derive active results and searched state based on query threshold
  const results = hasMinChars ? rawResults : [];
  const hasSearched = hasMinChars ? rawHasSearched : false;

  // Handle async search debouncing with useDeferredValue
  useEffect(() => {
    if (!hasMinChars) {
      return;
    }

    const requestId = ++latestRequestIdRef.current;

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const response = await searchAction(trimmedDeferred);

          // Discard response if a newer query was issued
          if (requestId !== latestRequestIdRef.current) {
            return;
          }

          const items: T[] = Array.isArray(response)
            ? response
            : Array.isArray((response as { data?: T[] | null })?.data)
              ? (((response as { data?: T[] | null }).data as T[]) ?? [])
              : [];

          setRawResults(items);
          setRawHasSearched(true);
          setLastSearchedQuery(trimmedDeferred);
          setError(null);
          setHighlightedIndex(-1);
        } catch (err) {
          if (requestId !== latestRequestIdRef.current) {
            return;
          }
          setError(
            err instanceof Error
              ? err.message
              : "Wystąpił błąd podczas wyszukiwania.",
          );
          setRawResults([]);
          setRawHasSearched(true);
          setLastSearchedQuery(trimmedDeferred);
          setHighlightedIndex(-1);
        }
      });
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [trimmedDeferred, hasMinChars, debounceMs, searchAction]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    if (!isControlled) {
      setInternalQuery(nextVal);
    }
    onQueryChange?.(nextVal);
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalQuery("");
    }
    onQueryChange?.("");
    setRawResults([]);
    setRawHasSearched(false);
    setLastSearchedQuery("");
    setError(null);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSelect = (item: T) => {
    onResultSelect?.(item);
    if (clearOnSelect) {
      if (!isControlled) {
        setInternalQuery("");
      }
      onQueryChange?.("");
      setRawResults([]);
      setRawHasSearched(false);
      setError(null);
      setHighlightedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        e.preventDefault();
        handleSelect(results[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setHighlightedIndex(-1);
    }
  };

  const showDropdown = resultsPlacement === "dropdown";
  const hasResultsToShow =
    Boolean(
      loadingComponent && isLoading && results.length === 0 && hasMinChars,
    ) ||
    Boolean(error && !isLoading) ||
    Boolean(hasSearched && results.length === 0 && hasMinChars) ||
    results.length > 0;

  return (
    <div className={cn("relative flex flex-col w-full gap-2", className)}>
      {/* Search Input Bar */}
      <div className="relative flex items-center w-full">
        <SearchIcon
          className="absolute left-3 size-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />

        <Input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={hasResultsToShow}
          aria-autocomplete="list"
          aria-controls={listboxId}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            "pl-9",
            isLoading || query.length > 0 ? "pr-16" : "pr-3",
            inputClassName,
          )}
        />

        {/* Status Indicators & Clear Action */}
        <div className="absolute right-2 flex items-center gap-1">
          {isLoading && (
            <Spinner
              className="size-4 text-muted-foreground animate-spin"
              aria-label="Ładowanie wyników"
            />
          )}

          {query.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleClear}
              disabled={disabled}
              aria-label="Wyczyść wyszukiwanie"
              className="text-muted-foreground hover:text-foreground h-6 w-6 p-0 rounded-full"
            >
              <X className="size-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Min Characters Hint - space reserved to prevent screen flickering */}
      {showMinCharsHint && (
        <div className="h-5 px-2 flex items-center" aria-live="polite">
          {query.trim().length > 0 && query.trim().length < minChars && (
            <p className="text-xs text-muted-foreground" role="status">
              Wpisz jeszcze co najmniej {minChars - query.trim().length}{" "}
              {minChars - query.trim().length === 1 ? "znak" : "znaki"}, aby
              wyszukać.
            </p>
          )}
        </div>
      )}

      {/* Results Section */}
      {hasResultsToShow && (
        <div
          className={cn(
            "w-full",
            showDropdown &&
              "absolute top-full left-0 right-0 z-50 mt-1 shadow-lg",
          )}
        >
          {/* 1. Optional custom loading state */}
          {loadingComponent &&
            isLoading &&
            results.length === 0 &&
            hasMinChars &&
            loadingComponent}

          {/* 2. Error State */}
          {error && !isLoading && (
            <Card
              className="border-destructive/30 bg-destructive/5 text-destructive p-4 text-sm"
              data-slot="search-error"
            >
              {error}
            </Card>
          )}

          {/* 3. Zero Results State */}
          {hasSearched && results.length === 0 && hasMinChars && (
            <div className={cn(isLoading && "opacity-60 transition-opacity")}>
              {emptyState ?? (
                <Card
                  className="border border-dashed shadow-xs"
                  data-slot="search-empty"
                >
                  <CardContent className="p-6">
                    <Empty>
                      <EmptyMedia variant="icon">
                        <SearchX
                          className="size-5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </EmptyMedia>
                      <EmptyHeader>
                        <EmptyTitle>{emptyTitle}</EmptyTitle>
                        <EmptyDescription>
                          {emptyDescription ??
                            `Nie znaleziono żadnych wyników dla frazy „${lastSearchedQuery || trimmedDeferred}”.`}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 4. Results List */}
          {results.length > 0 && (
            <Card
              className={cn(
                "border shadow-xs overflow-hidden",
                isLoading && "opacity-75 transition-opacity",
              )}
              data-slot="search-results"
            >
              <ScrollArea className={cn("max-h-72", resultsClassName)}>
                <div
                  id={listboxId}
                  role="listbox"
                  aria-label="Wyniki wyszukiwania"
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
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setHighlightedIndex(index)}
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
                          <span className="truncate">{getItemLabel(item)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Aliases for convenience and backward compatibility
export const Search = AsyncSearch;
export type SearchProps<T> = AsyncSearchProps<T>;
export const GenericSearch = AsyncSearch;
export type GenericSearchProps<T> = AsyncSearchProps<T>;
