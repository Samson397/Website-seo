import { Resend } from "resend";

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
  /** Unique per request; pattern: `<event-type>/<entity-id>` (max 256 chars). */
  idempotencyKey: string;
  tags?: { name: string; value: string }[];
};

/** Both API key and verified-domain from address are required for production sends. */
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

/**
 * Production from address — must use a domain verified at https://resend.com/domains.
 * Never falls back to onboarding@resend.dev.
 */
export function getFromEmail(): string | null {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from || null;
}

/**
 * Send via Resend Node SDK.
 * Uses `{ data, error }` — does not throw on API failures (only unexpected network errors may throw).
 */
export async function sendEmail(opts: SendEmailInput): Promise<SendEmailResult> {
  const resend = getResend();
  const from = getFromEmail();

  if (!resend || !from) {
    return {
      ok: false,
      error: "Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.",
    };
  }

  // Idempotency key is a request option (Idempotency-Key header), not a body field.
  const { data, error } = await resend.emails.send(
    {
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo,
      tags: opts.tags,
    },
    { idempotencyKey: opts.idempotencyKey.slice(0, 256) }
  );

  if (error) {
    return { ok: false, error: error.message || "Failed to send email" };
  }

  if (!data?.id) {
    return { ok: false, error: "Resend returned no email id" };
  }

  return { ok: true, id: data.id };
}
