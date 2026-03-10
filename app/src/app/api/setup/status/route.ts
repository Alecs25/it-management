import { NextResponse } from "next/server";
import { getSetupPrerequisites, isAppConfigured } from "@/lib/setup/setup-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const prerequisites = await getSetupPrerequisites();
  const configured = await isAppConfigured();
  return NextResponse.json({
    configured,
    prerequisites,
    prerequisitesReady: prerequisites.ready,
  });
}
