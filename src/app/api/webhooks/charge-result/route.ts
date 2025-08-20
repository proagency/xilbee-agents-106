import { NextResponse } from "next/server"
import { prisma } from "@lib/db"
import { MAKE_SHARED_KEY } from "@lib/config"

export async function POST(req: Request) {
  const key = req.headers.get("x-make-key")
  if (!MAKE_SHARED_KEY || key !== MAKE_SHARED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { payment_id, external_charge_id, status, error } = body
  if (!payment_id) return NextResponse.json({ error: "payment_id required" }, { status: 400 })

  await prisma.payment.update({
    where: { id: String(payment_id) },
    data: {
      externalChargeId: external_charge_id ? String(external_charge_id) : null,
      status: String(status).toUpperCase() === "SUCCEEDED" ? "SUCCEEDED" : (String(status).toUpperCase() === "FAILED" ? "FAILED" : "INITIATED"),
      metadata: error ? { error } : undefined,
    },
  })

  return NextResponse.json({ ok: true })
}
