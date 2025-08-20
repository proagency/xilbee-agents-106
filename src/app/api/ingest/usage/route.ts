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

  // Upsert client by name
  const client = await prisma.client.upsert({
    where: { name: clientName },
    update: {},
    create: { name: clientName },
  })

  let agentId: string | null = null
  if (body.agent_id) {
    // Try find agent by internal id or external id for this client
    const existing = await prisma.agent.findFirst({
      where: {
        clientId: client.id,
        OR: [{ id: body.agent_id }, { externalAgentId: body.agent_id }],
      },
    })
    if (existing) {
      agentId = existing.id
    } else {
      const a = await prisma.agent.create({
        data: { clientId: client.id, externalAgentId: String(body.agent_id), label: String(body.agent_id) },
      })
      agentId = a.id
    }
  }

  const sessionId: string = body.session_id
  const data: any = {
    clientId: client.id,
    agentId,
    timestamp: new Date(body.timestamp || new Date().toISOString()),
    connectionDurationSec: body.connection_duration ?? null,
    callCreditsUsed: body.call_credits_used != null ? new Prisma.Decimal(String(body.call_credits_used)) : null,
    llmCreditsUsed: body.llm_credits_used != null ? new Prisma.Decimal(String(body.llm_credits_used)) : null,
    llmRateUsdPerMin: body.llm_rate_usd_per_min != null ? new Prisma.Decimal(String(body.llm_rate_usd_per_min)) : null,
    llmTotalCostUsd: body.llm_total_cost_usd != null ? new Prisma.Decimal(String(body.llm_total_cost_usd)) : null,
    sessionId,
    contact: body.contact ?? null,
    notes: body.notes ?? null,
    totalCreditsConsumed: body.total_credits_consumed != null ? new Prisma.Decimal(String(body.total_credits_consumed)) : null,
    raw: body,
  }

  await prisma.usageLog.upsert({
    where: { sessionId },
    update: data,
    create: data,
  })

  return NextResponse.json({ ok: true })
}
