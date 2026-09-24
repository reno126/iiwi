import { Spinner } from "@/components/ui/spinner";
import { cn } from "cn";

export const SCRAPE_DELAY_MESSAGES = {
  defaultDelay: "Zajmie to chwilę dłużej, ale nadal pracuję nad tym...",
} as const;

interface ScrapeDelayNoticeProps {
  isVisible: boolean;
  className?: string;
  message?: string;
}

export function ScrapeDelayNotice({
  isVisible,
  className,
  message = SCRAPE_DELAY_MESSAGES.defaultDelay,
}: ScrapeDelayNoticeProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400",
        className,
      )}
    >
      <Spinner className="size-3.5" />
      <span>{message}</span>
    </div>
  );
}
