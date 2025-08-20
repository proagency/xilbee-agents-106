import { prisma } from "@lib/db"
import Link from "next/link"

function isAutobillEnabled(c: any) {
  return !!(c.stripeCustomerId && c.stripeDefaultPaymentMethod)
}

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      summaries: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 1 },
    },
  })
  const activeCount = clients.filter((c) => c.status === "ACTIVE").length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <span className="badge badge-success">Active Clients: {activeCount}</span>
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr className="text-left"><th>Name</th><th>Status</th><th>Auto-Bill</th><th>Last Payment Status</th><th>Actions</th></tr></thead>
          <tbody>
            {clients.map((c) => {
              const lastStatus = c.summaries[0]?.lastPaymentStatus ?? "-"
              return (
                <tr key={c.id} className="border-t">
                  <td><Link className="link" href={`/clients/${c.id}`}>{c.name}</Link></td>
                  <td>{c.status}</td>
                  <td>{isAutobillEnabled(c) ? <span className="badge badge-success">Enabled</span> : <span className="badge badge-muted">Disabled</span>}</td>
                  <td>{lastStatus}</td>
                  <td><Link className="btn" href={`/clients/${c.id}`}>Open</Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
