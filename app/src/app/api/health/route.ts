import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "it-credential-management",
    timestamp: new Date().toISOString(),
  });
}
