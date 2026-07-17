import Image from "next/image";

const sizes = {
  sm: 36,
  md: 44,
  lg: 56,
} as const;

/** Brand logo mark — uses transparent PNG when available. */
export function LogoMark({ size = "md" }: { size?: keyof typeof sizes }) {
  const px = sizes[size];

  return (
    <Image
      src="/logo.png"
      alt="SEOHub"
      width={px}
      height={Math.round(px * 1.15)}
      priority
      className="shrink-0 object-contain"
    />
  );
}
