import { NextResponse } from "next/server"
import { prisma } from "@lib/db"
import { Prisma } from "@prisma/client"

function toDec(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim()
  return s ? new Prisma.Decimal(s) : null
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const form = await req.formData()
  const billingAnchorDayStr = String(form.get("billingAnchorDay") || "").trim()
  const billingAnchorDay = billingAnchorDayStr ? Number(billingAnchorDayStr) : null
  if (billingAnchorDay && (billingAnchorDay < 1 || billingAnchorDay > 28)) {
    const url = new URL(`/clients/${params.id}?error=billing`, req.url)
    return NextResponse.redirect(url)
  }

  const nextChargeDateStr = String(form.get("nextChargeDate") || "").trim()
  const nextChargeDate = nextChargeDateStr ? new Date(nextChargeDateStr) : null

  const data: any = {
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
    billingContactName: String(form.get("billingContactName") || "") || null,
    billingContactEmail: String(form.get("billingContactEmail") || "") || null,
    invoiceExtraEmails: String(form.get("invoiceExtraEmails") || "") || null,
    billingAddressLine1: String(form.get("billingAddressLine1") || "") || null,
    billingAddressCity: String(form.get("billingAddressCity") || "") || null,
    billingAddressState: String(form.get("billingAddressState") || "") || null,
    billingAddressPostalCode: String(form.get("billingAddressPostalCode") || "") || null,
    billingAddressCountry: String(form.get("billingAddressCountry") || "") || null,
    taxId: String(form.get("taxId") || "") || null,
  }

  await prisma.client.update({ where: { id: params.id }, data })
  const url = new URL(`/clients/${params.id}?ok=billing`, req.url)
  return NextResponse.redirect(url)
}
