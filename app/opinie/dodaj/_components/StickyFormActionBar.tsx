import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";
import { cn } from "cn";

interface StickyFormActionBarProps {
  onBack?: () => void;
  backLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

const MemoizedStickyFormActionBar = memo(function MemoizedStickyFormActionBar({
  onBack,
  backLabel = "Wróć",
  onCancel,
  cancelLabel = "Anuluj",
  submitLabel = "Zapisz",
  isSubmitting = false,
  className,
}: StickyFormActionBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur-md md:static md:inset-auto md:z-auto md:mt-6 md:border-t-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none",
        className,
      )}
    >
      <div className="mx-auto flex max-w-2xl flex-col-reverse justify-between gap-2.5 sm:flex-row sm:items-center sm:gap-3">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isSubmitting}
            className="h-8 w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:h-9 sm:w-auto sm:text-sm"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Button>
        )}

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="touch"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-1/3 sm:w-auto"
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            size="touch"
            disabled={isSubmitting}
            className="w-2/3 font-semibold sm:w-auto"
          >
            {isSubmitting && <Spinner className="mr-2 size-4" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
});

export function StickyFormActionBar(props: StickyFormActionBarProps) {
  return <MemoizedStickyFormActionBar {...props} />;
}
