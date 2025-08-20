import { prisma } from "./db"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { cookies } from "next/headers"
import { AUTH_SECRET } from "./config"

const encoder = () => new TextEncoder().encode(AUTH_SECRET)

export async function authenticate(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { email } })
  if (!user) return null
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return null
  return user
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(encoder())

  cookies().set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function getSession(): Promise<JWTPayload & { uid: string } | null> {
  const c = cookies().get("session")
  if (!c) return null
  try {
    const { payload } = await jwtVerify(c.value, encoder())
    return payload as any
  } catch {
    return null
  }
}

export function clearSession() {
  cookies().set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}
