"use client";

import * as React from "react";
import { useState, useRef, useId, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "cn";
import { useAsyncSearch } from "./useAsyncSearch";
import { SearchInputBar } from "./SearchInputBar";
import { SearchEmptyState } from "./SearchEmptyState";
import { SearchResultsList } from "./SearchResultsList";

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
  const {
    query,
    trimmedDeferred,
    hasMinChars,
    isLoading,
    results,
    hasSearched,
    lastSearchedQuery,
    error,
    setQueryValue,
    clearSearch,
  } = useAsyncSearch<T>({
    searchAction,
    minChars,
    debounceMs,
    defaultValue,
    value,
    onQueryChange,
    defaultErrorMessage: ASYNC_SEARCH_MESSAGES.defaultError,
  });

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQueryValue(e.target.value);
    },
    [setQueryValue],
  );

  const handleClear = useCallback(() => {
    clearSearch();
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [clearSearch]);

  const handleSelect = useCallback(
    (item: T) => {
      onResultSelect?.(item);
      if (clearOnSelect) {
        clearSearch();
        setHighlightedIndex(-1);
      }
    },
    [onResultSelect, clearOnSelect, clearSearch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1,
        );
      } else if (e.key === "Enter") {
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          e.preventDefault();
          handleSelect(results[highlightedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setHighlightedIndex(-1);
      }
    },
    [results, highlightedIndex, handleSelect],
  );

  const showDropdown = resultsPlacement === "dropdown";
  const hasResultsToShow =
    Boolean(
      loadingComponent && isLoading && results.length === 0 && hasMinChars,
    ) ||
    Boolean(error && !isLoading) ||
    Boolean(hasSearched && results.length === 0 && hasMinChars) ||
    results.length > 0;

  return (
    <div className={cn("relative flex w-full flex-col gap-2", className)}>
      <SearchInputBar
        inputRef={inputRef}
        query={query}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onClear={handleClear}
        isLoading={isLoading}
        hasResultsToShow={hasResultsToShow}
        listboxId={listboxId}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={inputClassName}
        loadingAriaLabel={ASYNC_SEARCH_MESSAGES.loadingAriaLabel}
        clearAriaLabel={ASYNC_SEARCH_MESSAGES.clearAriaLabel}
      />

      {showMinCharsHint && (
        <div className="flex h-5 items-center px-2" aria-live="polite">
          {query.trim().length > 0 && query.trim().length < minChars && (
            <p className="text-xs text-muted-foreground" role="status">
              {ASYNC_SEARCH_MESSAGES.minCharsHint(
                minChars - query.trim().length,
              )}
            </p>
          )}
        </div>
      )}

      {hasResultsToShow && (
        <div
          className={cn(
            "w-full",
            showDropdown &&
              "absolute top-full right-0 left-0 z-50 mt-1 shadow-lg",
          )}
        >
          {loadingComponent &&
            isLoading &&
            results.length === 0 &&
            hasMinChars &&
            loadingComponent}

          {error && !isLoading && (
            <Card
              className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
              data-slot="search-error"
            >
              {error}
            </Card>
          )}

          {hasSearched && results.length === 0 && hasMinChars && (
            <div className={cn(isLoading && "opacity-60 transition-opacity")}>
              <SearchEmptyState
                emptyTitle={emptyTitle}
                emptyDescription={
                  emptyDescription ??
                  ASYNC_SEARCH_MESSAGES.defaultEmptyDescription(
                    lastSearchedQuery || trimmedDeferred,
                  )
                }
                customEmptyState={emptyState}
              />
            </div>
          )}

          {results.length > 0 && (
            <SearchResultsList
              results={results}
              listboxId={listboxId}
              resultsAriaLabel={ASYNC_SEARCH_MESSAGES.resultsAriaLabel}
              highlightedIndex={highlightedIndex}
              onSelect={handleSelect}
              onHighlight={setHighlightedIndex}
              getKey={getKey}
              getItemLabel={getItemLabel}
              renderItem={renderItem}
              isLoading={isLoading}
              className={resultsClassName}
            />
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
