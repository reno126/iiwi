import * as React from "react";
import { Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyRow } from "@/components/ui/property-row";
import { formatPolishDate, formatUserDisplayName } from "@/lib/formatters";
import { cn } from "cn";

interface AuthorSignatureSkeletonProps {
  avatarSize?: "sm" | "default" | "lg";
  className?: string;
}

export function AuthorSignatureSkeleton({
  avatarSize = "default",
  className,
}: AuthorSignatureSkeletonProps) {
  const avatarDimensions = {
    sm: "size-6",
    default: "size-8",
    lg: "size-10",
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Skeleton
        className={cn("shrink-0 rounded-full", avatarDimensions[avatarSize])}
      />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-3 w-20 rounded-md" />
      </div>
    </div>
  );
}

interface AuthorSignatureProps {
  name?: string | null;
  email?: string;
  image?: string | null;
  fallbackName?: string;
  date?: Date | string | null;
  avatarSize?: "sm" | "default" | "lg";
  className?: string;
}

export function AuthorSignature({
  name,
  email = "",
  image,
  fallbackName = "Anonimowy użytkownik",
  date,
  avatarSize = "default",
  className,
}: AuthorSignatureProps) {
  const displayName = formatUserDisplayName({ name, email }, fallbackName);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Avatar size={avatarSize}>
        {image && <AvatarImage src={image} alt={displayName} />}
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">
          {displayName}
        </span>
        {date && (
          <PropertyRow
            icon={Calendar}
            iconClassName="size-3"
            value={typeof date === "string" ? date : formatPolishDate(date)}
            className="gap-1 text-xs text-muted-foreground"
          />
        )}
      </div>
    </div>
  );
}
