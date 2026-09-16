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
import { cn } from "cn";

export const ASYNC_SEARCH_MESSAGES = {
  defaultPlaceholder: "Szukaj (min. 3 znaki)...",
  defaultEmptyTitle: "Brak wyników",
  loadingAriaLabel: "Ładowanie wyników",
  clearAriaLabel: "Wyczyść wyszukiwanie",
  resultsAriaLabel: "Wyniki wyszukiwania",
  defaultError: "Wystąpił błąd podczas wyszukiwania.",
  minCharsHint: (charsLeft: number) =>
    `Wpisz jeszcze co najmniej ${charsLeft} ${charsLeft === 1 ? "znak" : "znaki"}, aby wyszukać.`,
  defaultEmptyDescription: (query: string) =>
    `Nie znaleziono żadnych wyników dla frazy „${query}”.`,
} as const;

export interface AsyncSearchProps<T> {
  searchAction: (
    query: string,
  ) => Promise<T[] | { data?: T[] | null } | null | undefined>;
  getItemLabel?: (item: T) => string;
  onResultSelect?: (item: T) => void;
  renderItem?: (
    item: T,
    isHighlighted: boolean,
    index: number,
  ) => React.ReactNode;
  getKey?: (item: T, index: number) => string | number;
  minChars?: number;
  debounceMs?: number;
  placeholder?: string;
  resultsPlacement?: "inline" | "dropdown";
  emptyState?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  loadingComponent?: React.ReactNode;
  showMinCharsHint?: boolean;
  clearOnSelect?: boolean;
  className?: string;
  inputClassName?: string;
  resultsClassName?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  defaultValue?: string;
  value?: string;
  onQueryChange?: (query: string) => void;
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

export function AsyncSearch<T>({
  searchAction,
  onResultSelect,
  renderItem,
  getKey,
  getItemLabel,
  minChars = 3,
  debounceMs = 300,
  placeholder = ASYNC_SEARCH_MESSAGES.defaultPlaceholder,
  resultsPlacement = "inline",
  emptyState,
  emptyTitle = ASYNC_SEARCH_MESSAGES.defaultEmptyTitle,
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

  const deferredQuery = useDeferredValue(query);
  const isDeferredPending = query !== deferredQuery;

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

  const results = hasMinChars ? rawResults : [];
  const hasSearched = hasMinChars ? rawHasSearched : false;

  useEffect(() => {
    function executeDebouncedSearch() {
      if (!hasMinChars) {
        return;
      }

      const requestId = ++latestRequestIdRef.current;

      const timer = setTimeout(() => {
        startTransition(async () => {
          try {
            const response = await searchAction(trimmedDeferred);

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
                : ASYNC_SEARCH_MESSAGES.defaultError,
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
    }

    return executeDebouncedSearch();
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

        <div className="absolute right-2 flex items-center gap-1">
          {isLoading && (
            <Spinner
              className="size-4 text-muted-foreground animate-spin"
              aria-label={ASYNC_SEARCH_MESSAGES.loadingAriaLabel}
            />
          )}

          {query.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleClear}
              disabled={disabled}
              aria-label={ASYNC_SEARCH_MESSAGES.clearAriaLabel}
              className="text-muted-foreground hover:text-foreground size-6 p-0 rounded-full"
            >
              <X className="size-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {showMinCharsHint && (
        <div className="h-5 px-2 flex items-center" aria-live="polite">
          {query.trim().length > 0 && query.trim().length < minChars && (
            <p className="text-xs text-muted-foreground" role="status">
              {ASYNC_SEARCH_MESSAGES.minCharsHint(minChars - query.trim().length)}
            </p>
          )}
        </div>
      )}

      {hasResultsToShow && (
        <div
          className={cn(
            "w-full",
            showDropdown &&
              "absolute top-full left-0 right-0 z-50 mt-1 shadow-lg",
          )}
        >
          {loadingComponent &&
            isLoading &&
            results.length === 0 &&
            hasMinChars &&
            loadingComponent}

          {error && !isLoading && (
            <Card
              className="border-destructive/30 bg-destructive/5 text-destructive p-4 text-sm"
              data-slot="search-error"
            >
              {error}
            </Card>
          )}

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
                            ASYNC_SEARCH_MESSAGES.defaultEmptyDescription(
                              lastSearchedQuery || trimmedDeferred,
                            )}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

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
                  aria-label={ASYNC_SEARCH_MESSAGES.resultsAriaLabel}
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
          )}
        </div>
      )}
    </div>
  );
}

export const Search = AsyncSearch;
export type SearchProps<T> = AsyncSearchProps<T>;
export const GenericSearch = AsyncSearch;
export type GenericSearchProps<T> = AsyncSearchProps<T>;
