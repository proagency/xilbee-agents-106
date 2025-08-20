import { NextResponse } from "next/server"
import { prisma } from "@lib/db"
import { Prisma } from "@prisma/client"
import { INGEST_SHARED_KEY } from "@lib/config"

export async function POST(req: Request) {
  const key = req.headers.get("x-ingest-key")
  if (!INGEST_SHARED_KEY || key !== INGEST_SHARED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const clientName: string = body.client_name
  if (!clientName) return NextResponse.json({ error: "client_name required" }, { status: 400 })

  const client = await prisma.client.upsert({
    where: { name: clientName },
    update: {},
    create: { name: clientName },
  })

  const subDate = body.subscription_date ? new Date(body.subscription_date) : new Date()
  const year = subDate.getUTCFullYear()
  const month = subDate.getUTCMonth() + 1

  const data: any = {
    clientId: client.id,
    year, month,
    totalUsage: body.total_usage != null ? new Prisma.Decimal(String(body.total_usage)) : null,
    limit: body.limit != null ? new Prisma.Decimal(String(body.limit)) : null,
    overage: body.overage != null ? new Prisma.Decimal(String(body.overage)) : null,
    chargeAmount: body.charge_amount != null ? new Prisma.Decimal(String(body.charge_amount)) : null,
    subscriptionDate: body.subscription_date ? new Date(body.subscription_date) : null,
    lastChargeDate: body.last_charge_date ? new Date(body.last_charge_date) : null,
    lastPaymentStatus: body.last_payment_status ?? null,
    nextChargeDate: body.next_charge_date ? new Date(body.next_charge_date) : null,
    raw: body,
  }

  const existing = await prisma.monthlySummary.findUnique({
    where: { clientId_year_month: { clientId: client.id, year, month } },
  })

  if (existing) {
    await prisma.monthlySummary.update({
      where: { id: existing.id },
      data,
    })
  } else {
    await prisma.monthlySummary.create({ data })
  }

  return NextResponse.json({ ok: true })
}
