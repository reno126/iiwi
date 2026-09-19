import { memo } from "react";
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

const sizeClasses = {
  xs: "size-8",
  sm: "size-12",
  md: "size-16",
  lg: "size-24",
  xl: "size-32",
};

const MemoizedProductThumbnail = memo(function MemoizedProductThumbnail({
  src,
  alt,
  size = "md",
  aspectRatio = "square",
  className,
  priority = false,
  loading,
}: ProductThumbnailProps) {
  const imageLoading = priority ? "eager" : loading || "lazy";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted",
        sizeClasses[size],
        aspectRatio === "square" ? "aspect-square" : "aspect-video",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="size-full object-contain p-1"
          loading={imageLoading}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
      ) : (
        <Package
          className="size-1/2 text-muted-foreground/60"
          aria-hidden="true"
        />
      )}
    </div>
  );
});

export function ProductThumbnail(props: ProductThumbnailProps) {
  return <MemoizedProductThumbnail {...props} />;
}
