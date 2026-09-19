import * as React from "react";
import { memo } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "cn";

interface SearchInputBarProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  isLoading: boolean;
  hasResultsToShow: boolean;
  listboxId: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  loadingAriaLabel: string;
  clearAriaLabel: string;
}

const MemoizedSearchInputBar = memo(function MemoizedSearchInputBar({
  inputRef,
  query,
  onInputChange,
  onKeyDown,
  onClear,
  isLoading,
  hasResultsToShow,
  listboxId,
  placeholder,
  disabled = false,
  autoFocus = false,
  className,
  loadingAriaLabel,
  clearAriaLabel,
}: SearchInputBarProps) {
  return (
    <div className="relative flex w-full items-center">
      <SearchIcon
        className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
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
        onChange={onInputChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          "h-10 pr-16 pl-9 text-sm shadow-2xs transition-shadow focus-visible:ring-1",
          className,
        )}
      />

      <div className="absolute right-2.5 flex items-center gap-1.5">
        {isLoading && (
          <span
            className="flex items-center text-muted-foreground"
            role="status"
            aria-label={loadingAriaLabel}
          >
            <Spinner className="size-4" />
          </span>
        )}

        {query.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClear}
            disabled={disabled}
            aria-label={clearAriaLabel}
            className="size-6 rounded-full p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
});

export function SearchInputBar(props: SearchInputBarProps) {
  return <MemoizedSearchInputBar {...props} />;
}
