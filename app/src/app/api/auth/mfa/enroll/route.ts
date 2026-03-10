import { NextRequest, NextResponse } from "next/server";
import { mfaService } from "@/lib/services/mfa-service";
import { verifyTokenFromRequest } from "@/lib/auth/session";
import { checkRateLimit, mfaRateLimiter } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(mfaRateLimiter, ip, "/api/auth/mfa/enroll")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const session = verifyTokenFromRequest(req);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await mfaService.generateMFASecret(session.email);

  return NextResponse.json({
    secret: result.secret,
    qrCode: result.qrCode,
  });
}
