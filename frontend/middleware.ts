export const runtime = "nodejs";

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const publicRoutes = [
    "/signin",
    "/signup",
    "/login",
    "/api/auth",
  ];

  if (publicRoutes.some((r) => path.startsWith(r))) return NextResponse.next();
  if (path.startsWith("/_next") || path.includes(".")) return NextResponse.next();

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.redirect(new URL("/signin", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
