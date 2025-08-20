import { NextResponse } from "next/server"
import { prisma } from "@lib/db"
import { MAKE_STRIPE_ONE_TIME_CHARGE_URL } from "@lib/config"

export async function POST(req: Request) {
  const form = await req.formData()
  const clientId = String(form.get("clientId") || "")
  const amountStr = String(form.get("amount") || "")
  const paymentMethodId = String(form.get("paymentMethodId") || "")
  const customerName = String(form.get("customerName") || "")
  const customerEmail = String(form.get("customerEmail") || "")
  const stripeCustomerId = String(form.get("stripeCustomerId") || "")
  const currency = String(form.get("currency") || "USD")

  if (!clientId || !amountStr || !paymentMethodId || !customerName || !customerEmail || !stripeCustomerId || !currency) {
    return NextResponse.redirect(new URL("/billing?status=failed", req.url))
  }

  const amount = BigInt(amountStr)

  const payment = await prisma.payment.create({
    data: { clientId, amount, paymentMethodId, status: "INITIATED", currency },
  })

  try {
    const res = await fetch(MAKE_STRIPE_ONE_TIME_CHARGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Required by Make
        name: customerName,
        email: customerEmail,
        payment_method_id: paymentMethodId,
        stripe_customer_id: stripeCustomerId,
        amount: Number(amount),        // integer (minor units)
        currency,                      // e.g., "USD"

        // extra context
        account_id: clientId,
        payment_id: payment.id,
        customer_name: customerName,   // backwards compatibility
        customer_email: customerEmail
      }),
    })

    if (!res.ok) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", metadata: { httpStatus: res.status } } })
      return NextResponse.redirect(new URL("/billing?status=failed", req.url))
    }

    await prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCEEDED" } })
    return NextResponse.redirect(new URL("/billing?status=ok", req.url))
  } catch (e: any) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", metadata: { error: String(e) } } })
    return NextResponse.redirect(new URL("/billing?status=failed", req.url))
  }
}
