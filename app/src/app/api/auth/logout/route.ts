import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  clearAuthCookies(response);
  return response;
}
