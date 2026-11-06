import {
  useState,
  useDeferredValue,
  useEffect,
  useRef,
  useTransition,
  useCallback,
  useMemo,
} from "react";

const EMPTY_RESULTS: never[] = [];

export interface AsyncSearchActionResponse<SearchItem> {
  data?: SearchItem[] | null;
  serverError?: string;
  validationErrors?: unknown;
}

export type AsyncSearchActionResult<SearchItem> =
  | SearchItem[]
  | AsyncSearchActionResponse<SearchItem>
  | null
  | undefined;

export interface UseAsyncSearchOptions<SearchItem> {
  searchAction: (query: string) => Promise<AsyncSearchActionResult<SearchItem>>;
  minChars?: number;
  debounceMs?: number;
  defaultValue?: string;
  value?: string;
  onQueryChange?: (query: string) => void;
  defaultErrorMessage?: string;
}

export function useAsyncSearch<SearchItem>({
  searchAction,
  minChars = 3,
  debounceMs = 300,
  defaultValue = "",
  value,
  onQueryChange,
  defaultErrorMessage = "Wystąpił błąd podczas wyszukiwania.",
}: UseAsyncSearchOptions<SearchItem>) {
  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState(defaultValue);
  const query = isControlled ? value : internalQuery;

  const deferredQuery = useDeferredValue(query);
  const isDeferredPending = query !== deferredQuery;

  const [isActionPending, startTransition] = useTransition();

  const [rawResults, setRawResults] = useState<SearchItem[]>([]);
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
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        startTransition(async () => {
          try {
            const response = await searchAction(trimmedDeferred);

            if (requestId !== latestRequestIdRef.current) {
              return;
            }

            if (
              response &&
              !Array.isArray(response) &&
              (response.serverError !== undefined ||
                response.validationErrors !== undefined)
            ) {
              setError(response.serverError || defaultErrorMessage);
              setRawResults(EMPTY_RESULTS);
              setRawHasSearched(false);
              setLastSearchedQuery(trimmedDeferred);
              return;
            }

            let items: SearchItem[] = [];
            if (Array.isArray(response)) {
              items = response;
            } else if (
              response &&
              typeof response === "object" &&
              "data" in response &&
              Array.isArray(response.data)
            ) {
              items = response.data;
            }

            setRawResults(items);
            setRawHasSearched(true);
            setLastSearchedQuery(trimmedDeferred);
            setError(null);
          } catch (searchError) {
            if (requestId !== latestRequestIdRef.current) {
              return;
            }
            setError(
              searchError instanceof Error
                ? searchError.message
                : defaultErrorMessage,
            );
            setRawResults(EMPTY_RESULTS);
            setRawHasSearched(false);
            setLastSearchedQuery(trimmedDeferred);
          }
        });
      }, debounceMs);

      return () => {
        clearTimeout(timer);
        ++latestRequestIdRef.current;
      };
    }

    return executeDebouncedSearch();
  }, [
    trimmedDeferred,
    hasMinChars,
    debounceMs,
    searchAction,
    defaultErrorMessage,
  ]);

  const setQueryValue = useCallback(
    (nextQuery: string) => {
      if (!isControlled) {
        setInternalQuery(nextQuery);
      }
      onQueryChange?.(nextQuery);
    },
    [isControlled, onQueryChange],
  );

  const clearSearch = useCallback(() => {
    ++latestRequestIdRef.current;
    setQueryValue("");
    setRawResults(EMPTY_RESULTS);
    setRawHasSearched(false);
    setLastSearchedQuery("");
    setError(null);
  }, [setQueryValue]);

  const resetResults = useCallback(() => {
    ++latestRequestIdRef.current;
    setRawResults(EMPTY_RESULTS);
    setRawHasSearched(false);
    setLastSearchedQuery("");
    setError(null);
  }, []);

  return useMemo(
    () => ({
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
    }),
    [
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
    ],
  );
}
