import * as React from "react";
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

export function SearchInputBar({
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
        onChange={onInputChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          "pl-9",
          isLoading || query.length > 0 ? "pr-16" : "pr-3",
          className,
        )}
      />

      <div className="absolute right-2 flex items-center gap-1">
        {isLoading && (
          <Spinner
            className="size-4 text-muted-foreground animate-spin"
            aria-label={loadingAriaLabel}
          />
        )}

        {query.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClear}
            disabled={disabled}
            aria-label={clearAriaLabel}
            className="text-muted-foreground hover:text-foreground size-6 p-0 rounded-full"
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
