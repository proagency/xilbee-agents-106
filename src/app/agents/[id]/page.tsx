import { prisma } from "@lib/db"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function AgentDetail({ params }: { params: { id: string } }) {
  const agent = await prisma.agent.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      usageLogs: { orderBy: { timestamp: "desc" }, take: 25 },
    },
  })
  if (!agent) return notFound()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{agent.label ?? "Agent"}</h1>
          <div className="text-sm text-gray-600">ID: <span className="badge">{agent.id}</span></div>
        </div>
        <Link href={`/clients/${agent.clientId}`} className="btn">← Back to {agent.client.name}</Link>
      </div>

      <div className="card">
        <h2 className="section-title">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><div className="text-sm text-gray-600">Client</div><Link href={`/clients/${agent.clientId}`} className="link">{agent.client.name}</Link></div>
          <div><div className="text-sm text-gray-600">External ID</div><div>{agent.externalAgentId ?? "-"}</div></div>
          <div><div className="text-sm text-gray-600">Status</div><div>{agent.status}</div></div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Recent Usage Logs</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr className="text-left">
              <th>Timestamp</th><th>Session</th><th>Contact</th><th>Conn Sec</th><th>LLM $/min</th><th>LLM Cost</th><th>Total Credits</th>
            </tr></thead>
            <tbody>
              {agent.usageLogs.map((u) => (
                <tr key={u.id} className="border-t">
                  <td>{new Date(u.timestamp).toLocaleString()}</td>
                  <td className="truncate max-w-[150px]">{u.sessionId}</td>
                  <td className="truncate max-w-[160px]">{u.contact ?? "-"}</td>
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
