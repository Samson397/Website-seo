import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { forwardWebhook, insertScanEvent } from "@/lib/store";

const schema = z.object({
  hostname: z.string().min(1).max(253),
  tld: z.string().max(64).optional().default(""),
  overall: z.number().int().min(0).max(100),
  seo: z.number().int().min(0).max(100),
  performance: z.number().int().min(0).max(100),
  accessibility: z.number().int().min(0).max(100),
  security: z.number().int().min(0).max(100),
  passCount: z.number().int().min(0).max(500).optional().default(0),
  failCount: z.number().int().min(0).max(500).optional().default(0),
  attentionCount: z.number().int().min(0).max(500).optional().default(0),
  pagesScanned: z.number().int().min(0).max(10_000).optional().default(1),
  criticalIssues: z.number().int().min(0).max(10_000).optional().default(0),
  warningIssues: z.number().int().min(0).max(10_000).optional().default(0),
  scannedAt: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = schema.parse(body);

    const payload = {
      ...event,
      scannedAt: event.scannedAt || new Date().toISOString(),
    };

    const stored = await insertScanEvent(payload);
    await forwardWebhook({ type: "scan_event", event: payload });

    return NextResponse.json({ ok: true, stored });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid telemetry payload" }, { status: 400 });
    }
    console.error("[telemetry]", err);
    return NextResponse.json({ error: "Telemetry failed" }, { status: 500 });
  }
}
