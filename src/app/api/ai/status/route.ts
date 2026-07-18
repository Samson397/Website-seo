import { NextResponse } from "next/server";
import { isDeepSeekConfigured, getDeepSeekModel } from "@/lib/deepseek";

export const runtime = "nodejs";

/** Whether AI brief generation is available on this deployment. */
export async function GET() {
  const enabled = isDeepSeekConfigured();
  return NextResponse.json({
    enabled,
    provider: enabled ? "deepseek" : null,
    model: enabled ? getDeepSeekModel() : null,
  });
}
