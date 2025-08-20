import { NextResponse } from "next/server"
import { prisma } from "@lib/db"
import { Prisma } from "@prisma/client"
import { INGEST_SHARED_KEY } from "@lib/config"

// Helpers to safely coerce values
function decOrNull(v: unknown): Prisma.Decimal | null {
  // Accept numbers and numeric strings; reject null/undefined/""/NaN
  if (v === null || v === undefined) return null
  if (typeof v === "string") {
    const s = v.trim()
    if (!s) return null
    const n = Number(s)
    if (!Number.isFinite(n)) return null
    return new Prisma.Decimal(s)
  }
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return null
    return new Prisma.Decimal(v.toString())
  }
  return null
}

function intOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === "string") {
    const s = v.trim()
    if (!s) return null
    const n = Number(s)
    return Number.isFinite(n) ? Math.trunc(n) : null
  }
  if (typeof v === "number") {
    return Number.isFinite(v) ? Math.trunc(v) : null
  }
  return null
}

function parseDateOrNow(v: unknown): Date {
  if (typeof v === "string") {
    const s = v.trim()
    if (s) {
      const d = new Date(s)
      if (!isNaN(d.getTime())) return d
    }
  }
  // Fallback: now (UTC)
  return new Date()
}

export async function POST(req: Request) {
  // Auth header
  const key = req.headers.get("x-ingest-key")
  if (!INGEST_SHARED_KEY || key !== INGEST_SHARED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // Required: client_name
  const clientName = typeof body.client_name === "string" ? body.client_name.trim() : ""
  if (!clientName) {
    return NextResponse.json({ error: "client_name required" }, { status: 400 })
  }

  // Required: session_id (unique key for idempotency)
  const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : ""
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 })
  }

  // Upsert client by name
  const client = await prisma.client.upsert({
    where: { name: clientName },
    update: {},
    create: { name: clientName },
  })

  // Optional: agent upsert/lookup
  let agentId: string | null = null
  const agentKeyRaw = body.agent_id
  const agentKey = typeof agentKeyRaw === "string" ? agentKeyRaw.trim() : ""
  if (agentKey) {
    const existing = await prisma.agent.findFirst({
      where: {
        clientId: client.id,
        OR: [{ id: agentKey }, { externalAgentId: agentKey }],
      },
    })
    if (existing) {
      agentId = existing.id
    } else {
      const created = await prisma.agent.create({
        data: { clientId: client.id, externalAgentId: agentKey, label: agentKey },
      })
      agentId = created.id
    }
  }

  // Build the upsert data safely
  const data: any = {
    clientId: client.id,
    agentId: agentId ?? null,
    timestamp: parseDateOrNow(body.timestamp),
    connectionDurationSec: intOrNull(body.connection_duration),
    callCreditsUsed: decOrNull(body.call_credits_used),
    llmCreditsUsed: decOrNull(body.llm_credits_used),
    llmRateUsdPerMin: decOrNull(body.llm_rate_usd_per_min),
    llmTotalCostUsd: decOrNull(body.llm_total_cost_usd),
    sessionId,
    contact: typeof body.contact === "string" && body.contact.trim() ? body.contact.trim() : null,
    notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    totalCreditsConsumed: decOrNull(body.total_credits_consumed),
    raw: body, // keep original payload
  }

  try {
    await prisma.usageLog.upsert({
      where: { sessionId }, // unique on model
      update: data,
      create: data,
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    // Surface a helpful error for debugging payloads
    return NextResponse.json(
      { error: "Prisma upsert failed", detail: String(e) },
      { status: 400 }
    )
  }
}
