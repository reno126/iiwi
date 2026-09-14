import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "cn";

interface ProductThumbnailProps {
  src?: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  aspectRatio?: "square" | "video";
  className?: string;
}

export function ProductThumbnail({
  src,
  alt,
  size = "md",
  aspectRatio = "square",
  className,
}: ProductThumbnailProps) {
  const sizeClasses = {
    xs: "size-8",
    sm: "size-12",
    md: "size-16",
    lg: "size-24",
    xl: "size-32",
  };

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
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100px, 150px"
          className="object-contain p-1"
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
