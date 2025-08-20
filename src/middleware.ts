// src/middleware.ts
import { NextResponse, NextRequest } from "next/server"
import { jwtVerify } from "jose"

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/ingest/usage",
  "/api/ingest/summary",
  "/api/webhooks/charge-result",
  "/api/health",
  "/_next",
  "/favicon.ico",
]

// Helper: only treat exact path or subpaths as public
function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = req.cookies.get("session")?.value
  if (!token) {
    // Use req.nextUrl.clone() so the redirect uses the same origin (Railway domain)
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    // preserve the full destination (path + query) so we can bounce back after login
    url.searchParams.set("next", pathname + (search || ""))
    return NextResponse.redirect(url)
  }

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret")
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("expired", "1")
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
