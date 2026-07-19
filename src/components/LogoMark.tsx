import Image from "next/image";

const heights = {
  sm: 44,
  md: 56,
  lg: 72,
} as const;

/** Full SEOHub logo (transparent PNG from brand artwork). */
export function LogoMark({ size = "md" }: { size?: keyof typeof heights }) {
  const height = heights[size];
  // Source logo ~720×797
  const width = Math.round(height * (720 / 797));

  return (
    <Image
      src="/logo.png"
      alt="SEOHub"
      width={width}
      height={height}
      priority
      className="shrink-0 object-contain"
    />
  );
}
