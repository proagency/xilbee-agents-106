'use client'

import { useMemo, useState } from "react"

type Client = {
  id: string
  name: string
  stripeCustomerId: string | null
  stripeDefaultPaymentMethod: string | null
  currency: string
  billingContactName: string | null
  billingContactEmail: string | null
}

export default function ClientChargeForm({ clients }: { clients: Client[] }) {
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "")
  const selected = useMemo(() => clients.find(c => c.id === clientId), [clientId, clients])
  const [paymentMethodId, setPaymentMethodId] = useState<string>(selected?.stripeDefaultPaymentMethod ?? "")
  const [customerName, setCustomerName] = useState<string>(selected?.billingContactName || selected?.name || "")
  const [customerEmail, setCustomerEmail] = useState<string>(selected?.billingContactEmail || "")

  const autobillConfigured = !!(selected?.stripeCustomerId && selected?.stripeDefaultPaymentMethod)

  function onClientChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    setClientId(id)
    const c = clients.find(x => x.id === id)
    setPaymentMethodId(c?.stripeDefaultPaymentMethod ?? "")
    setCustomerName(c?.billingContactName || c?.name || "")
    setCustomerEmail(c?.billingContactEmail || "")
  }

  const disable = !paymentMethodId || !selected?.stripeCustomerId || !customerName || !customerEmail

  return (
    <form method="POST" action="/api/charge/one-time" className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Client</label>
        <select name="clientId" className="input" value={clientId} onChange={onClientChange} required>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!autobillConfigured && (
        <div className="border border-amber-300 bg-amber-50 text-amber-800 rounded-lg p-3 text-sm">
          Autobill not fully configured (missing <code>cus_</code> or <code>pm_</code>).
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Amount (minor units)</label>
          <input name="amount" type="number" className="input" min={1} placeholder="e.g. 4999" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Payment Method ID</label>
          <input name="paymentMethodId" className="input" value={paymentMethodId} onChange={(e)=>setPaymentMethodId(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input name="customerName" className="input" value={customerName} onChange={(e)=>setCustomerName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input name="customerEmail" type="email" className="input" value={customerEmail} onChange={(e)=>setCustomerEmail(e.target.value)} required />
        </div>
      </div>

      {/* Hidden fields required by Make */}
      <input type="hidden" name="stripeCustomerId" value={selected?.stripeCustomerId ?? ""} />
      <input type="hidden" name="currency" value={selected?.currency ?? "USD"} />

      <div className="text-sm">
        <div>Stripe Customer: <code>{selected?.stripeCustomerId || "-"}</code></div>
        <div>Currency: <code>{selected?.currency || "USD"}</code></div>
      </div>

      <button className="btn btn-primary" disabled={disable}>Trigger One-time Charge</button>
    </form>
  )
}
