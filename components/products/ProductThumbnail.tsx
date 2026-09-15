import { Package } from "lucide-react";
import { cn } from "cn";

interface ProductThumbnailProps {
  src?: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  aspectRatio?: "square" | "video";
  className?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
}

export function ProductThumbnail({
  src,
  alt,
  size = "md",
  aspectRatio = "square",
  className,
  priority = false,
  loading,
}: ProductThumbnailProps) {
  const sizeClasses = {
    xs: "size-8",
    sm: "size-12",
    md: "size-16",
    lg: "size-24",
    xl: "size-32",
  };

  const imageLoading = priority ? "eager" : loading || "lazy";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted flex items-center justify-center shrink-0",
        sizeClasses[size],
        aspectRatio === "square" ? "aspect-square" : "aspect-video",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="size-full object-contain p-1"
          loading={imageLoading}
        />
      ) : (
        <Package
          className="size-1/2 text-muted-foreground/60"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
