"use client";

import { useState, useRef, useEffect } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/shadcn/utils";

export interface ReadMoreProps {
  text?: string;
  children?: React.ReactNode;
  maxLines?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  moreLabel?: string;
  lessLabel?: string;
}

const lineClampMap: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};

export function ReadMore({
  text,
  children,
  maxLines = 5,
  className,
  moreLabel = "Czytaj więcej",
  lessLabel = "Zwiń",
}: ReadMoreProps) {
  const content = text ?? (typeof children === "string" ? children : undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [isClamped, setIsClamped] = useState(() => {
    if (!content) return false;
    return content.split("\n").length > maxLines || content.length > 250;
  });

  const clampedRef = useRef<HTMLParagraphElement>(null);
  const clampClass = lineClampMap[maxLines] ?? "line-clamp-5";

  useEffect(() => {
    const checkOverflow = () => {
      if (clampedRef.current) {
        const hasOverflow =
          clampedRef.current.scrollHeight > clampedRef.current.clientHeight + 1;
        setIsClamped(hasOverflow);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [content, maxLines]);

  if (!content && !children) {
    return null;
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("w-full", className)}
    >
      {!isOpen && (
        <p
          ref={clampedRef}
          className={cn(
            "whitespace-pre-line text-sm leading-relaxed text-muted-foreground",
            clampClass,
          )}
        >
          {children ?? content}
        </p>
      )}

      <CollapsibleContent>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {children ?? content}
        </p>
      </CollapsibleContent>

      {(isClamped || isOpen) && (
        <CollapsibleTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-auto p-0 text-xs font-semibold text-primary hover:bg-transparent hover:underline"
            />
          }
        >
          <span className="inline-flex items-center gap-1">
            {isOpen ? lessLabel : moreLabel}
            {isOpen ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </span>
        </CollapsibleTrigger>
      )}
    </Collapsible>
  );
}
