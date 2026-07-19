import Image from "next/image";

const heights = {
  sm: 40,
  md: 48,
  lg: 64,
} as const;

/** Full SEOHub logo (transparent PNG from brand artwork). */
export function LogoMark({ size = "md" }: { size?: keyof typeof heights }) {
  const height = heights[size];
  // Source logo ~720×803
  const width = Math.round(height * (720 / 803));

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
