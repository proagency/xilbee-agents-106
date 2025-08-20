import { NextResponse } from "next/server"
import { prisma } from "@lib/db"

export async function POST(req: Request) {
  const form = await req.formData()
  const clientId = String(form.get("clientId") || "")
  const label = String(form.get("label") || "")
  const externalAgentId = String(form.get("externalAgentId") || "") || null
  const next = String(form.get("next") || "/dashboard")

  await prisma.agent.create({ data: { clientId, label, externalAgentId } })
  return NextResponse.redirect(new URL(next, req.url))
}
