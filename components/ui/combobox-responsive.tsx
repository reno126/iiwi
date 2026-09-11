"use client";

import * as React from "react";
import { cn } from "cn";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";

export interface ComboboxResponsiveProps<T> {
  /** Array of items to select from. */
  items: T[];
  /** Controlled selected value. */
  value?: string;
  /** Callback fired when an item is selected or cleared. */
  onValueChange?: (value: string, item?: T) => void;

  /** Returns the unique identifier for an item. */
  getItemValue: (item: T) => string;
  /** Returns the display/search string for an item. */
  getItemLabel?: (item: T) => string;
  /** Optional custom client-side filter function. */
  filterFn?: (item: T, search: string) => boolean;

  /** Render prop for each option in the list. */
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  /** Optional render prop for the trigger button content. */
  renderTrigger?: (selectedItem: T | undefined, isOpen: boolean) => React.ReactNode;

  /** Placeholder when nothing is selected. */
  placeholder?: string;
  /** Search input placeholder. */
  searchPlaceholder?: string;
  /** Empty state message. */
  emptyText?: string;
  /** Title for mobile full-screen dialog (accessibility requirement). */
  dialogTitle?: string;

  /** Disabled state. */
  disabled?: boolean;
  /** Whether selecting the currently selected item clears it. Defaults to true. */
  clearable?: boolean;

  /** Controlled open state. */
  open?: boolean;
  /** Callback fired when the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Whether the items are loading. */
  loading?: boolean;
  /** Loading text. */
  loadingText?: string;

  /** Additional classes. */
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  triggerId?: string;
  ariaLabel?: string;
}

export function ComboboxResponsive<T>({
  items,
  value,
  onValueChange,
  getItemValue,
  getItemLabel,
  filterFn,
  renderItem,
  renderTrigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  loading = false,
  loadingText = "Ładowanie...",
  placeholder = "Wybierz opcję...",
  searchPlaceholder = "Szukaj...",
  emptyText = "Nie znaleziono wyników.",
  dialogTitle,
  disabled = false,
  clearable = true,
  className,
  triggerClassName,
  contentClassName,
  triggerId,
  ariaLabel,
}: ComboboxResponsiveProps<T>) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      setControlledOpen?.(nextOpen);
    },
    [isControlled, setControlledOpen]
  );
  const [search, setSearch] = React.useState("");
  const isMobile = useIsMobile();

  const selectedItem = React.useMemo(() => {
    if (!value) return undefined;
    return items.find((item) => getItemValue(item) === value);
  }, [items, value, getItemValue]);

  const handleSelect = React.useCallback(
    (itemValue: string, item: T) => {
      if (clearable && itemValue === value) {
        onValueChange?.("", undefined);
      } else {
        onValueChange?.(itemValue, item);
      }
      setOpen(false);
      setSearch("");
    },
    [clearable, value, onValueChange, setOpen]
  );

  const displayedItems = React.useMemo(() => {
    if (!filterFn || !search.trim()) return items;
    return items.filter((item) => filterFn(item, search.trim()));
  }, [items, filterFn, search]);

  const triggerContent = React.useMemo(() => {
    if (renderTrigger) {
      return renderTrigger(selectedItem, open);
    }
    if (selectedItem) {
      return (
        <span className="truncate">
          {getItemLabel ? getItemLabel(selectedItem) : getItemValue(selectedItem)}
        </span>
      );
    }
    return <span className="text-muted-foreground truncate">{placeholder}</span>;
  }, [renderTrigger, selectedItem, open, getItemLabel, getItemValue, placeholder]);

  const commandListContent = (
    <Command
      className="flex size-full flex-col overflow-hidden"
      shouldFilter={!filterFn}
    >
      <CommandInput
        placeholder={searchPlaceholder}
        value={search}
        onValueChange={setSearch}
        autoFocus
      />
      <CommandList className={cn("max-h-72 overflow-y-auto", isMobile && "max-h-none flex-1")}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            <span>{loadingText}</span>
          </div>
        ) : (
          <>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {displayedItems.map((item) => {
                const itemValue = getItemValue(item);
                const isSelected = itemValue === value;
                const searchKey = getItemLabel ? getItemLabel(item) : itemValue;

                return (
                  <CommandItem
                    key={itemValue}
                    value={searchKey}
                    onSelect={() => handleSelect(itemValue, item)}
                    className="cursor-pointer"
                  >
                    {renderItem(item, isSelected)}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <div className={cn("w-full", className)}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button
                id={triggerId}
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-label={ariaLabel || placeholder}
                disabled={disabled}
                className={cn(
                  "flex h-9 w-full items-center justify-between gap-2 px-3 text-left font-normal",
                  triggerClassName
                )}
              />
            }
          >
            <div className="flex flex-1 items-center gap-2 truncate">
              {triggerContent}
            </div>
          </DialogTrigger>

          <DialogContent
            showCloseButton={true}
            className={cn(
              "fixed inset-0 top-0 left-0 z-50 flex h-full max-h-screen w-full max-w-full -translate-x-0 -translate-y-0 flex-col rounded-none border-0 p-0 shadow-none sm:rounded-none",
              contentClassName
            )}
          >
            <DialogHeader className="border-b px-4 py-3 text-left">
              <DialogTitle className="text-base font-semibold">
                {dialogTitle || placeholder}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-1 flex-col overflow-hidden p-2">
              {commandListContent}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={triggerId}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label={ariaLabel || placeholder}
              disabled={disabled}
              className={cn(
                "flex h-9 w-full items-center justify-between gap-2 px-3 text-left font-normal",
                triggerClassName
              )}
            />
          }
        >
          <div className="flex flex-1 items-center gap-2 truncate">
            {triggerContent}
          </div>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          className={cn("w-(--trigger-width) min-w-[220px] p-0 shadow-md", contentClassName)}
        >
          {commandListContent}
        </PopoverContent>
      </Popover>
    </div>
  );
}
