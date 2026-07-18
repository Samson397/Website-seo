import { NextResponse } from "next/server";
import { canPersistSpotlights } from "@/lib/blog-spotlights";
import { FULL_SCAN_PRICE_LABEL, getStripePriceId, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Public: whether paid unlock is live (no secrets exposed). */
export async function GET() {
  const configured = isStripeConfigured();
  return NextResponse.json({
    enabled: configured,
    priceLabel: FULL_SCAN_PRICE_LABEL,
    priceIdSet: Boolean(getStripePriceId()),
    publishableKeySet: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    /** Neon available — opt-in site spotlights can be published after paid scans */
    blogSpotlights: canPersistSpotlights(),
  });
}
