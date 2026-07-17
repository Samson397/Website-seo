import Image from "next/image";

const sizes = {
  sm: 32,
  md: 40,
  lg: 52,
} as const;

/** Transparent SEOHub hexagon mark (alpha PNG). */
export function LogoMark({ size = "md" }: { size?: keyof typeof sizes }) {
  const px = sizes[size];

  return (
    <Image
      src="/logo-mark.png"
      alt="SEOHub"
      width={px}
      height={px}
      priority
      className="shrink-0 object-contain"
    />
  );
}
