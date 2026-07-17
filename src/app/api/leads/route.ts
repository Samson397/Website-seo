import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { forwardWebhook, insertLead, isStoreConfigured } from "@/lib/store";

const schema = z.object({
  email: z.string().email().max(254),
  source: z.enum(["report", "benchmarks", "footer", "tools"]).default("report"),
  hostname: z.string().max(253).optional(),
  consent: z.literal(true),
  marketingOptIn: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = schema.parse(body);

    if (!input.consent) {
      return NextResponse.json({ error: "Consent is required" }, { status: 400 });
    }

    const status = await insertLead({
      email: input.email,
      source: input.source,
      hostname: input.hostname,
      consent: true,
      marketingOptIn: input.marketingOptIn,
    });

    await forwardWebhook({
      type: "lead",
      email: input.email.trim().toLowerCase(),
      source: input.source,
      hostname: input.hostname,
      marketingOptIn: input.marketingOptIn,
      consent: true,
    });

    if (status === "skipped" && !process.env.DATA_WEBHOOK_URL) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Lead capture is not configured yet. Set DATABASE_URL or DATA_WEBHOOK_URL on the server.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      stored: status !== "skipped" || Boolean(process.env.DATA_WEBHOOK_URL),
      database: isStoreConfigured(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid email and accept the consent box." }, { status: 400 });
    }
    console.error("[leads]", err);
    return NextResponse.json({ error: "Could not save email" }, { status: 500 });
  }
}
