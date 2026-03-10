import { NextResponse } from "next/server";
import { isAppConfigured } from "@/lib/setup/setup-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configured = await isAppConfigured();
  return NextResponse.json({ configured });
}
