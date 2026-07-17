import Image from "next/image";

const sizes = {
  sm: 44,
  md: 56,
  lg: 64,
} as const;

export function LogoMark({ size = "md" }: { size?: keyof typeof sizes }) {
  const px = sizes[size];

  return (
    <Image
      src="/logo.svg"
      alt="SEOHub"
      width={px}
      height={px}
      priority
      className="shrink-0 drop-shadow-lg"
    />
  );
}
