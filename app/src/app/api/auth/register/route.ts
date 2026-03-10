import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { authService } from "@/lib/services/auth-service";
import { auditService } from "@/lib/services/audit-service";
import { checkRateLimit, authRateLimiter } from "@/lib/middleware/rate-limit";
import { v4 as uuidv4 } from "uuid";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["admin", "manager", "technician", "readonly"]).default("readonly"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const correlationId = req.headers.get("x-correlation-id") ?? uuidv4();

  if (!checkRateLimit(authRateLimiter, ip, "/api/auth/register")) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password, firstName, lastName, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "User already exists" }, { status: 409 });
  }

  const passwordHash = await authService.hashPassword(password);
  const user = await prisma.user.create({
    data: { id: uuidv4(), email, passwordHash, role, firstName, lastName },
  });

  auditService.logResourceChange(
    user.id, "USER_CREATE", "user", user.id,
    undefined, email, "success", ip, correlationId
  );

  return NextResponse.json(
    { message: "User registered successfully", userId: user.id },
    { status: 201 }
  );
}
