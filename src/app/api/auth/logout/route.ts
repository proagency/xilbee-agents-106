import { NextResponse } from "next/server"
import { clearSession } from "@lib/auth"

export async function POST(req: Request) {
  clearSession()
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || ""
  const proto = req.headers.get("x-forwarded-proto") || "https"
  const base = `${proto}://${host}`
  return NextResponse.redirect(new URL("/login", base))
}
