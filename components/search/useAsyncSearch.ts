import {
  useState,
  useDeferredValue,
  useEffect,
  useRef,
  useTransition,
  useCallback,
} from "react";

const EMPTY_RESULTS: never[] = [];

export interface UseAsyncSearchOptions<T> {
  searchAction: (
    query: string,
  ) => Promise<T[] | { data?: T[] | null } | null | undefined>;
  minChars?: number;
  debounceMs?: number;
  defaultValue?: string;
  value?: string;
  onQueryChange?: (query: string) => void;
  defaultErrorMessage?: string;
}

export function useAsyncSearch<T>({
  searchAction,
  minChars = 3,
  debounceMs = 300,
  defaultValue = "",
  value,
  onQueryChange,
  defaultErrorMessage = "Wystąpił błąd podczas wyszukiwania.",
}: UseAsyncSearchOptions<T>) {
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

  const latestRequestIdRef = useRef(0);

  const isLoading = isActionPending || isDeferredPending;
  const trimmedDeferred = deferredQuery.trim();
  const hasMinChars = trimmedDeferred.length >= minChars;

  const results = hasMinChars ? rawResults : EMPTY_RESULTS;
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
          } catch (err) {
            if (requestId !== latestRequestIdRef.current) {
              return;
            }
            setError(
              err instanceof Error
                ? err.message
                : defaultErrorMessage,
            );
            setRawResults(EMPTY_RESULTS);
            setRawHasSearched(true);
            setLastSearchedQuery(trimmedDeferred);
          }
        });
      }, debounceMs);

      return () => {
        clearTimeout(timer);
      };
    }

    return executeDebouncedSearch();
  }, [trimmedDeferred, hasMinChars, debounceMs, searchAction, defaultErrorMessage]);

  const setQueryValue = useCallback(
    (nextVal: string) => {
      if (!isControlled) {
        setInternalQuery(nextVal);
      }
      onQueryChange?.(nextVal);
    },
    [isControlled, onQueryChange],
  );

  const clearSearch = useCallback(() => {
    setQueryValue("");
    setRawResults(EMPTY_RESULTS);
    setRawHasSearched(false);
    setLastSearchedQuery("");
    setError(null);
  }, [setQueryValue]);

  const resetResults = useCallback(() => {
    setRawResults(EMPTY_RESULTS);
    setRawHasSearched(false);
    setError(null);
  }, []);

  return {
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
    resetResults,
  };
}
