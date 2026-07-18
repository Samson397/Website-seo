import Image from "next/image";

const heights = {
  sm: 28,
  md: 36,
  lg: 48,
} as const;

/** Transparent SEOHub mark from the real brand logo (background removed). */
export function LogoMark({ size = "md" }: { size?: keyof typeof heights }) {
  const height = heights[size];
  // Source mark is ~577×374
  const width = Math.round(height * (577 / 374));

  return (
    <Image
      src="/logo-mark.png"
      alt="SEOHub"
      width={width}
      height={height}
      priority
      className="shrink-0 object-contain"
    />
  );
}
