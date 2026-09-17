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
        "fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg md:static md:inset-auto md:z-auto md:border-t-0 md:p-0 md:bg-transparent md:backdrop-blur-none md:shadow-none md:mt-6",
        className,
      )}
    >
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 max-w-2xl mx-auto">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isSubmitting}
            className="gap-1.5 text-muted-foreground hover:text-foreground w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Button>
        )}

        <div className="flex items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
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
            className="w-2/3 sm:w-auto font-semibold"
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
