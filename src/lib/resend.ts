import { Resend } from "resend";
import { APP_NAME } from "@/lib/brand";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || `${APP_NAME} <onboarding@resend.dev>`;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ id?: string }> {
  const resend = getResend();
  if (!resend) throw new Error("RESEND_API_KEY is not configured");

  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  if (error) throw new Error(error.message || "Failed to send email");
  return { id: data?.id };
}
