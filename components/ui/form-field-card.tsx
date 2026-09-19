"use client";

import { Check, CircleAlert } from "lucide-react";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

interface FormFieldCardProps {
  label: string;
  htmlFor?: string;
  isFilled?: boolean;
  showStatus?: boolean;
  filledBadgeText?: string;
  missingBadgeText?: string;
  error?: string;
  reserveSpace?: boolean;
  dataInvalid?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormFieldCard({
  label,
  htmlFor,
  isFilled = false,
  showStatus = false,
  filledBadgeText = "Uzupełnione",
  missingBadgeText = "Do uzupełnienia",
  error,
  reserveSpace = false,
  dataInvalid,
  className,
  children,
}: FormFieldCardProps) {
  const isInvalid = dataInvalid ?? Boolean(error);

  return (
    <Field
      data-invalid={isInvalid}
      className={cn(
        "rounded-xl p-3.5 shadow-2xs transition-all sm:p-4",
        showStatus && isFilled
          ? "border-2 border-emerald-500 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20"
          : showStatus
            ? "border-2 border-gray-300 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-900/30"
            : "border border-border/80 bg-white focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2",
          showStatus && "mb-2",
        )}
      >
        <FieldLabel
          htmlFor={htmlFor}
          className={cn(
            "text-sm font-medium",
            showStatus && isFilled
              ? "inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 font-semibold text-white shadow-xs"
              : showStatus
                ? "inline-flex items-center gap-1.5 rounded-md bg-gray-600 px-2.5 py-1 font-semibold text-white shadow-xs"
                : "text-foreground",
          )}
        >
          {showStatus &&
            (isFilled ? (
              <Check className="size-3.5 stroke-[2.5] sm:size-4" />
            ) : (
              <CircleAlert className="size-3.5 sm:size-4" />
            ))}
          <span>{label}</span>
        </FieldLabel>

        {showStatus && (
          <Badge
            variant={isFilled ? "success" : "neutral"}
            className="shrink-0 text-xs"
          >
            {isFilled ? filledBadgeText : missingBadgeText}
          </Badge>
        )}
      </div>
      {children}
      {(error || reserveSpace) && (
        <FieldError reserveSpace={reserveSpace}>{error}</FieldError>
      )}
    </Field>
  );
}
