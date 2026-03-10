import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "auth_token";

const PROTECTED_PREFIXES = ["/dashboard", "/clients", "/sites", "/credentials", "/devices", "/audit"];
const AUTH_PATHS = ["/auth/login", "/auth/mfa-enroll"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const proto = req.headers.get("x-forwarded-proto");
  if (proto === "http") {
    const httpsUrl = new URL(req.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl);
  }

  const setupPath = pathname.startsWith("/setup");
  const prerequisitesPath = pathname.startsWith("/setup/prerequisites");
  const status = await fetch(new URL("/api/setup/status", req.url), {
    cache: "no-store",
    headers: {
      "x-middleware-check": "1",
    },
  }).then((res) => (res.ok ? res.json() : { configured: true }))
    .catch(() => ({ configured: true }));

  if (!status.prerequisitesReady && !prerequisitesPath) {
    return NextResponse.redirect(new URL("/setup/prerequisites", req.url));
  }

  if (status.prerequisitesReady && prerequisitesPath && !status.configured) {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  if (status.prerequisitesReady && !status.configured && !setupPath) {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  if (status.configured && setupPath) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
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
  matcher: ["/", "/setup/:path*", "/dashboard/:path*", "/clients/:path*", "/sites/:path*", "/credentials/:path*", "/devices/:path*", "/audit/:path*", "/auth/:path*"],
};
