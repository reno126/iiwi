import { formatPolishDateTime } from "@/lib/formatters";
import { cn } from "cn";

interface ResponsiveDateTimeProps {
  date: Date | string;
  includeTime?: boolean;
  className?: string;
}

export function ResponsiveDateTime({
  date,
  includeTime = true,
  className,
}: ResponsiveDateTimeProps) {
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  const isValidDate =
    parsedDate instanceof Date && !isNaN(parsedDate.getTime());

  if (!isValidDate) {
    return <span className={cn(className)}>{String(date)}</span>;
  }

  return (
    <time dateTime={parsedDate.toISOString()} className={cn(className)}>
      <span className="sm:hidden">
        {formatPolishDateTime(parsedDate, "short", includeTime)}
      </span>
      <span className="hidden sm:inline">
        {formatPolishDateTime(parsedDate, "long", includeTime)}
      </span>
    </time>
  );
}
