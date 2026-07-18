import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  createPromoCodeAdmin,
  listAllPromoCodesAdmin,
  updatePromoCodeAdmin,
} from "@/lib/promo-codes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const codes = await listAllPromoCodesAdmin();
    return NextResponse.json({ codes });
  } catch (err) {
    console.error("[admin/promos]", err);
    return NextResponse.json({ error: "Could not load promo codes." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { code?: string; maxUses?: number; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const result = await createPromoCodeAdmin({
    code: String(body.code || ""),
    maxUses: Number(body.maxUses),
    label: typeof body.label === "string" ? body.label : undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ code: result.code });
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { code?: string; active?: boolean; maxUses?: number; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.code) {
    return NextResponse.json({ error: "code is required." }, { status: 400 });
  }
  const result = await updatePromoCodeAdmin({
    code: body.code,
    active: typeof body.active === "boolean" ? body.active : undefined,
    maxUses: typeof body.maxUses === "number" ? body.maxUses : undefined,
    label: typeof body.label === "string" ? body.label : undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ code: result.code });
}
