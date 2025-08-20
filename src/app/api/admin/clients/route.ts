import { NextResponse } from "next/server"
import { prisma } from "@lib/db"
import { Prisma } from "@prisma/client"

function toDec(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim()
  return s ? new Prisma.Decimal(s) : null
}

export async function POST(req: Request) {
  const form = await req.formData()
  const name = String(form.get("name") || "").trim()
  const billingAnchorDayStr = String(form.get("billingAnchorDay") || "").trim()
  const billingAnchorDay = billingAnchorDayStr ? Number(billingAnchorDayStr) : null
  if (billingAnchorDay && (billingAnchorDay < 1 || billingAnchorDay > 28)) {
    return NextResponse.json({ error: "billingAnchorDay must be 1..28" }, { status: 400 })
  }

  const nextChargeDateStr = String(form.get("nextChargeDate") || "").trim()
  const nextChargeDate = nextChargeDateStr ? new Date(nextChargeDateStr) : null

  const data: any = {
    name,
    billingContactName: String(form.get("billingContactName") || "") || null,
    billingContactEmail: String(form.get("billingContactEmail") || "") || null,
    stripeCustomerId: String(form.get("stripeCustomerId") || "") || null,
    stripeDefaultPaymentMethod: String(form.get("stripeDefaultPaymentMethod") || "") || null,
    currency: String(form.get("currency") || "USD"),
    baseMonthlyFee: toDec(form.get("baseMonthlyFee")),
    monthlyCreditLimit: toDec(form.get("monthlyCreditLimit")),
    overageRatePerCredit: toDec(form.get("overageRatePerCredit")),
    usageUnitLabel: String(form.get("usageUnitLabel") || "") || null,
    billingAnchorDay,
    billingTimezone: String(form.get("billingTimezone") || "") || null,
    nextChargeDate,
  }

  await prisma.client.create({ data })
  return NextResponse.redirect(new URL("/dashboard", req.url))
}
