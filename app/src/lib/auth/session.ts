import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { authService, JWTPayload } from "@/lib/services/auth-service";

const COOKIE_NAME = "auth_token";
const REFRESH_COOKIE_NAME = "refresh_token";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

// --- Server-Side (Route Handlers) ---

export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set(COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60, // 1 hour
  });
}

export function setRefreshCookie(res: NextResponse, token: string): void {
  res.cookies.set(REFRESH_COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}

export function getAuthTokenFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get(COOKIE_NAME)?.value;
}

export function getRefreshTokenFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get(REFRESH_COOKIE_NAME)?.value;
}

// --- Server Components (App Router) ---

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return authService.verifyToken(token);
}

export async function requireSession(): Promise<JWTPayload> {
  const session = await getSession();
  if (!session || !session.mfa) {
    throw new Error("Unauthorized");
  }
  return session;
}

// --- Middleware helpers ---

export function verifyTokenFromRequest(req: NextRequest): JWTPayload | null {
  const token = getAuthTokenFromRequest(req);
  if (!token) return null;
  return authService.verifyToken(token);
}
