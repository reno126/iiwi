import { Store } from "lucide-react";
import { cn } from "cn";

interface ShopLogoProps {
  logo?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ShopLogo({
  logo,
  name,
  size = "md",
  className,
}: ShopLogoProps) {
  const containerSizes = {
    sm: "size-6 p-0.5",
    md: "size-9 p-1",
    lg: "size-16 p-1",
  };

  const iconSizes = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-7",
  };

  if (!logo) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md border bg-muted",
          containerSizes[size],
          className,
        )}
      >
        <Store
          className={cn("text-muted-foreground", iconSizes[size])}
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md border bg-white",
        containerSizes[size],
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={name || "Sklep"}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}
