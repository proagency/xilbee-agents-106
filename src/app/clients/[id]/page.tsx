import { prisma } from "@lib/db"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Prisma } from "@prisma/client"

function decToNum(d?: Prisma.Decimal | null) {
  if (!d) return 0
  return Number(d)
}
function isAutobillEnabled(c: any) {
  return !!(c.stripeCustomerId && c.stripeDefaultPaymentMethod)
}

export default async function ClientDetail({ params, searchParams }: { params: { id: string }, searchParams: Record<string,string|undefined> }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      agents: true,
      usageLogs: { orderBy: { timestamp: "desc" }, take: 50, include: { agent: true } },
      summaries: { orderBy: [{ year: "desc" }, { month: "desc" }] },
    },
  })
  if (!client) return notFound()

  const latestSummary = client.summaries[0]
  const ok = searchParams?.ok

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge">{client.status}</span>
            {isAutobillEnabled(client) ? <span className="badge badge-success">Auto-Bill Enabled</span> : <span className="badge badge-muted">Auto-Bill Disabled</span>}
          </div>
        </div>
        <Link href="/clients" className="btn">← Back to Clients</Link>
      </div>

      {ok === "billing" && (
        <div className="card border-green-300 bg-green-50 text-green-700">Billing configuration updated.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card"><div className="text-sm text-gray-600">Agents</div><div className="text-2xl font-semibold">{client.agents.length}</div></div>
        <div className="card"><div className="text-sm text-gray-600">Usage Logs</div><div className="text-2xl font-semibold">{client.usageLogs.length}</div></div>
        <div className="card"><div className="text-sm text-gray-600">Latest Summary</div><div className="text-2xl font-semibold">{latestSummary ? `${latestSummary.month}/${latestSummary.year}` : "-"}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="section-title">Add New Agent</h2>
          <form method="POST" action="/api/admin/agents" className="grid grid-cols-2 gap-3">
            <input type="hidden" name="clientId" value={client.id} />
            <input type="hidden" name="next" value={`/clients/${client.id}`} />
            <input name="label" placeholder="Agent label" className="input col-span-2" />
            <input name="externalAgentId" placeholder="External ID" className="input col-span-2" />
            <button className="btn btn-primary col-span-2">Create Agent</button>
          </form>
        </div>

        <div className="card">
          <h2 className="section-title">Billing Configuration (Edit)</h2>
          <form method="POST" action={`/api/admin/clients/${client.id}/billing`} className="grid grid-cols-2 gap-3">
            <input name="stripeCustomerId" placeholder="cus_..." className="input" defaultValue={client.stripeCustomerId ?? ""} />
            <input name="stripeDefaultPaymentMethod" placeholder="pm_..." className="input" defaultValue={client.stripeDefaultPaymentMethod ?? ""} />
            <input name="currency" placeholder="USD" className="input" defaultValue={client.currency ?? "USD"} />
            <input name="baseMonthlyFee" placeholder="199.00" className="input" defaultValue={client.baseMonthlyFee?.toString() ?? ""} />
            <input name="monthlyCreditLimit" placeholder="1000" className="input" defaultValue={client.monthlyCreditLimit?.toString() ?? ""} />
            <input name="overageRatePerCredit" placeholder="0.20" className="input" defaultValue={client.overageRatePerCredit?.toString() ?? ""} />
            <input name="usageUnitLabel" placeholder="credit" className="input" defaultValue={client.usageUnitLabel ?? ""} />
            <input name="billingAnchorDay" placeholder="1-28" className="input" type="number" min={1} max={28} defaultValue={client.billingAnchorDay ?? undefined} />
            <input name="billingTimezone" placeholder="Asia/Manila" className="input" defaultValue={client.billingTimezone ?? ""} />
            <div className="col-span-2">
              <label className="block text-sm mb-1">Next Charge Date</label>
              <input name="nextChargeDate" className="input" type="datetime-local" defaultValue={client.nextChargeDate ? new Date(client.nextChargeDate).toISOString().slice(0,16) : ""} />
            </div>
            <input name="billingContactName" placeholder="Billing Contact Name" className="input" defaultValue={client.billingContactName ?? ""} />
            <input name="billingContactEmail" placeholder="Billing Contact Email" className="input" defaultValue={client.billingContactEmail ?? ""} />
            <input name="invoiceExtraEmails" placeholder="CC Emails (comma)" className="input col-span-2" defaultValue={client.invoiceExtraEmails ?? ""} />

            <input name="billingAddressLine1" placeholder="Address Line 1" className="input col-span-2" defaultValue={client.billingAddressLine1 ?? ""} />
            <input name="billingAddressCity" placeholder="City" className="input" defaultValue={client.billingAddressCity ?? ""} />
            <input name="billingAddressState" placeholder="State" className="input" defaultValue={client.billingAddressState ?? ""} />
            <input name="billingAddressPostalCode" placeholder="Postal Code" className="input" defaultValue={client.billingAddressPostalCode ?? ""} />
            <input name="billingAddressCountry" placeholder="Country" className="input" defaultValue={client.billingAddressCountry ?? ""} />
            <input name="taxId" placeholder="Tax ID" className="input" defaultValue={client.taxId ?? ""} />
            <button className="btn btn-primary col-span-2">Save Billing</button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Agents</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr className="text-left"><th>Label</th><th>External ID</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {client.agents.map((a) => (
                <tr key={a.id} className="border-t">
                  <td><a className="link" href={`/agents/${a.id}`}>{a.label ?? "-"}</a></td>
                  <td className="truncate max-w-[220px]">{a.externalAgentId ?? "-"}</td>
                  <td>{a.status}</td>
                  <td><a className="btn" href={`/agents/${a.id}`}>Open</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Monthly Summaries</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr className="text-left"><th>Month</th><th>Total</th><th>Limit</th><th>Overage</th><th>Charge</th><th>Last Status</th><th>Next Charge</th></tr></thead>
            <tbody>
              {client.summaries.map((s) => (
                <tr key={s.id} className="border-t">
                  <td>{s.month}/{s.year}</td>
                  <td>{decToNum(s.totalUsage)}</td>
                  <td>{decToNum(s.limit)}</td>
                  <td>{decToNum(s.overage)}</td>
                  <td>{decToNum(s.chargeAmount)}</td>
                  <td>{s.lastPaymentStatus ?? "-"}</td>
                  <td>{s.nextChargeDate ? new Date(s.nextChargeDate).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Recent Usage Logs</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr className="text-left">
              <th>Timestamp</th><th>Session</th><th>Contact</th><th>Agent</th><th>Conn Sec</th><th>LLM $/min</th><th>LLM Cost</th><th>Total Credits</th>
            </tr></thead>
            <tbody>
              {client.usageLogs.map((u) => (
                <tr key={u.id} className="border-t">
                  <td>{new Date(u.timestamp).toLocaleString()}</td>
                  <td className="truncate max-w-[150px]">{u.sessionId}</td>
                  <td className="truncate max-w-[160px]">{u.contact ?? "-"}</td>
                  <td>{u.agentId ? <a className="link" href={`/agents/${u.agentId}`}>{u.agent?.label ?? u.agentId}</a> : "-"}</td>
                  <td>{u.connectionDurationSec ?? "-"}</td>
                  <td>{u.llmRateUsdPerMin?.toString() ?? "-"}</td>
                  <td>{u.llmTotalCostUsd?.toString() ?? "-"}</td>
                  <td>{u.totalCreditsConsumed?.toString() ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
