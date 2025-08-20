import { NextResponse } from "next/server"
import { authenticate, createSession } from "@lib/auth"

export async function POST(req: Request) {
  const form = await req.formData()
  const email = String(form.get("email") || "")
  const password = String(form.get("password") || "")
  const nextPath = String(form.get("next") || "/dashboard")

  const user = await authenticate(email, password)
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=1", req.url))
  }
  await createSession(user.id)

  // Build absolute URL using proxy headers (works on Railway, Vercel, etc.)
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || ""
  const proto = req.headers.get("x-forwarded-proto") || "https"
  const base = `${proto}://${host}`

  return NextResponse.redirect(new URL(nextPath.startsWith("/") ? nextPath : `/${nextPath}`, base))
}
