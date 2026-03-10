import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { authService } from "@/lib/services/auth-service";
import { isAppConfigured } from "@/lib/setup/setup-service";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const configured = await isAppConfigured();
  if (configured) {
    return NextResponse.json({ message: "Application already configured" }, { status: 409 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ message: "Email already exists" }, { status: 409 });
  }

  const passwordHash = await authService.hashPassword(parsed.data.password);
  const created = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: "admin",
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      mfaEnabled: false,
      isActive: true,
    },
    select: { id: true, email: true, role: true },
  });

  return NextResponse.json({ message: "Setup completed", user: created }, { status: 201 });
}
