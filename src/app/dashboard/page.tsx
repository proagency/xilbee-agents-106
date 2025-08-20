import { prisma } from "@lib/db"
import Link from "next/link"
import { Prisma } from "@prisma/client"

function decToNum(d?: Prisma.Decimal | null) {
  if (!d) return 0
  return Number(d)
}

function fmt(n: number) {
  return new Intl.NumberFormat().format(n)
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n)
}

export default async function DashboardPage() {
  const clients = await prisma.client.findMany()
  const activeClients = clients.filter((c) => c.status === "ACTIVE").length

  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1

  const summaries = await prisma.monthlySummary.findMany({
    where: { year, month },
    include: { client: true },
  })

  const totalUsage = summaries.reduce((acc, s) => acc + decToNum(s.totalUsage), 0)
  const projectedCharges = summaries.reduce((acc, s) => acc + decToNum(s.chargeAmount), 0)

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { client: true },
  })

  const clientsForForm = await prisma.client.findMany({ orderBy: { name: "asc" } })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><div className="text-sm text-gray-600">Clients</div><div className="text-2xl font-semibold">{clients.length}</div></div>
        <div className="card"><div className="text-sm text-gray-600">Active Clients</div><div className="text-2xl font-semibold">{activeClients}</div></div>
        <div className="card"><div className="text-sm text-gray-600">Total Usage (current month)</div><div className="text-2xl font-semibold">{fmt(totalUsage)}</div></div>
        <div className="card"><div className="text-sm text-gray-600">Projected Charges (current month)</div><div className="text-2xl font-semibold">{fmtUSD(projectedCharges)}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="section-title">Add New Client (with Stripe Billing)</h2>
          <form method="POST" action="/api/admin/clients" className="grid grid-cols-2 gap-3">
            <input name="name" placeholder="Name" className="input col-span-2" required />
            <input name="billingContactName" placeholder="Billing Contact Name" className="input" />
            <input name="billingContactEmail" placeholder="Billing Contact Email" className="input" type="email" />
            <input name="stripeCustomerId" placeholder="cus_..." className="input" />
            <input name="stripeDefaultPaymentMethod" placeholder="pm_..." className="input" />
            <input name="currency" placeholder="USD" className="input" defaultValue="USD" />
            <input name="baseMonthlyFee" placeholder="199.00" className="input" />
            <input name="monthlyCreditLimit" placeholder="1000" className="input" />
            <input name="overageRatePerCredit" placeholder="0.20" className="input" />
            <input name="usageUnitLabel" placeholder="credit" className="input" />
            <input name="billingAnchorDay" placeholder="1-28" className="input" type="number" min={1} max={28} />
            <input name="billingTimezone" placeholder="Asia/Manila" className="input" defaultValue="Asia/Manila" />
            <div className="col-span-2">
              <label className="block text-sm mb-1">Next Charge Date</label>
              <input name="nextChargeDate" className="input" type="datetime-local" />
            </div>
            <button className="btn btn-primary col-span-2">Create Client</button>
          </form>
        </div>

        <div className="card">
          <h2 className="section-title">Add New Agent</h2>
          <form method="POST" action="/api/admin/agents" className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm mb-1">Client</label>
              <select name="clientId" className="input" required>
                {clientsForForm.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <input name="label" placeholder="Agent label" className="input col-span-2" />
            <input name="externalAgentId" placeholder="External ID" className="input col-span-2" />
            <input type="hidden" name="next" value="/dashboard" />
            <button className="btn btn-primary col-span-2">Create Agent</button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Monthly Summaries (current month)</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr className="text-left">
              <th>Client</th><th>Total Usage</th><th>Limit</th><th>Overage</th><th>Charge</th><th>Next Charge</th><th>Status</th>
            </tr></thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.id} className="border-t">
                  <td><Link className="link" href={`/clients/${s.clientId}`}>{s.client.name}</Link></td>
                  <td>{fmt(decToNum(s.totalUsage))}</td>
                  <td>{fmt(decToNum(s.limit))}</td>
                  <td>{fmt(decToNum(s.overage))}</td>
                  <td>{fmtUSD(decToNum(s.chargeAmount))}</td>
                  <td>{s.nextChargeDate ? new Date(s.nextChargeDate).toLocaleString() : "-"}</td>
                  <td>{s.lastPaymentStatus ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Recent Payments</h2>
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
