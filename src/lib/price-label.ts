const FALLBACK = "$0.99";

/** Keep UI price copy safe if env is corrupted or oversized. */
export function sanitizePriceLabel(raw: string | undefined | null): string {
  const value = (raw || "").trim();
  if (!value || value.length > 16) return FALLBACK;
  if (!/^\$?\d{1,4}(\.\d{1,2})?$/.test(value)) return FALLBACK;
  return value.startsWith("$") ? value : `$${value}`;
}

export const DEFAULT_PRICE_LABEL = FALLBACK;
