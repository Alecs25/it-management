import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "auth_token";

const PROTECTED_PREFIXES = ["/dashboard", "/clients", "/sites", "/credentials", "/devices", "/audit"];
const AUTH_PATHS = ["/auth/login", "/auth/mfa-enroll"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/setup") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAuthPath) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Not authenticated at all
  if (!token) {
    if (isProtected) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    return NextResponse.next();
  }

  // Verify token
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET ?? "CHANGE_ME_IN_PRODUCTION"
    );
    const { payload } = await jwtVerify(token, secret);

    const mfa = payload.mfa as boolean;

    // Trying to access dashboard without full MFA
    if (isProtected && !mfa) {
      return NextResponse.redirect(new URL("/auth/mfa-enroll", req.url));
    }

    // Already fully authenticated — redirect away from auth pages
    if (isAuthPath && mfa) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid/expired token
    const response = NextResponse.redirect(new URL("/auth/login", req.url));
    response.cookies.set(COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
    return response;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/clients/:path*", "/sites/:path*", "/credentials/:path*", "/devices/:path*", "/audit/:path*", "/auth/:path*"],
};
