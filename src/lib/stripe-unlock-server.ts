import { getStripe } from "@/lib/stripe";

/** Server-side: confirm a Checkout session unlocks full site crawl. */
export async function verifyPaidSession(sessionId: string | undefined | null): Promise<boolean> {
  if (!sessionId || !sessionId.startsWith("cs_")) return false;
  const stripe = getStripe();
  if (!stripe) return false;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.payment_status === "paid" || session.status === "complete";
  } catch {
    return false;
  }
}
