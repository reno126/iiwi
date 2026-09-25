import Image from "next/image";

interface BrandLogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  width = 192,
  height = 36,
  className = "h-9 w-auto",
  priority = true,
}: BrandLogoProps) {
  return (
    <Image
      src="/TrueReview_logo.svg"
      alt="Logo TrueReview"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
