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

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = req.cookies.get("session")?.value
  if (!token) {
    const url = new URL("/login", req.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret")
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    const url = new URL("/login", req.url)
    url.searchParams.set("expired", "1")
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
