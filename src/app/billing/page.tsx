import { prisma } from "@lib/db"
import ClientChargeForm from "@components/ClientChargeForm"
import Link from "next/link"

function isAutobillEnabled(c: any) {
  return !!(c.stripeCustomerId && c.stripeDefaultPaymentMethod)
}

export default async function BillingPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      summaries: true,
    },
  })

  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1

  function nextChargeForClient(c: typeof clients[number]) {
    const current = c.summaries.find((s) => s.year === year && s.month === month)
    return current?.nextChargeDate ?? c.nextChargeDate ?? null
  }

  const soonest = clients
    .map((c) => nextChargeForClient(c))
    .filter(Boolean)
    .sort((a: any, b: any) => +new Date(a as any) - +new Date(b as any))[0] ?? null

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true },
    take: 20,
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="section-title">One-time Charge</h2>
          <ClientChargeForm clients={clients.map(c => ({
            id: c.id,
            name: c.name,
            stripeCustomerId: c.stripeCustomerId,
            stripeDefaultPaymentMethod: c.stripeDefaultPaymentMethod,
            currency: c.currency,
            billingContactName: c.billingContactName,
            billingContactEmail: c.billingContactEmail,
          }))} />
        </div>
        <div className="card">
          <h2 className="section-title">Next Auto-Charge</h2>
          <div className="text-2xl font-semibold">{soonest ? new Date(soonest).toLocaleString() : "-"}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Upcoming Auto-Charges (Current Month)</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr className="text-left"><th>Client</th><th>Next Charge</th><th>Autobill</th></tr></thead>
            <tbody>
              {clients.map((c) => {
                const d = nextChargeForClient(c)
                return (
                  <tr key={c.id} className="border-t">
                    <td><Link className="link" href={`/clients/${c.id}`}>{c.name}</Link></td>
                    <td>{d ? new Date(d).toLocaleString() : "-"}</td>
                    <td>{isAutobillEnabled(c) ? "Yes" : "No"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Payments</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr className="text-left"><th>Date</th><th>Client</th><th>Amount</th><th>Status</th><th>External ID</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t">
                  <td>{new Date(p.createdAt).toLocaleString()}</td>
                  <td><Link className="link" href={`/clients/${p.clientId}`}>{p.client.name}</Link></td>
                  <td>{(Number(p.amount)/100).toFixed(2)} {p.currency}</td>
                  <td>{p.status}</td>
                  <td className="truncate max-w-[160px]">{p.externalChargeId ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
