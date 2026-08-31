import Image from "next/image";

interface BrandLogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  width = 160,
  height = 40,
  className = "h-9 w-auto",
  priority = true,
}: BrandLogoProps) {
  return (
    <Image
      src="/TrueReview_logo.svg"
      alt="TrueReview Logo"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
