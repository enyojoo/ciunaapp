"use client"
import { useEffect, useState } from "react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { officeFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MarketplaceCatalog } from "@/components/hub/marketplace-catalog"
export default function MarketplaceOperations() {
  const [data, setData] = useState<any>({ orders: [], jobs: [] }),
    [selected, setSelected] = useState<any>(null),
    [error, setError] = useState(""),
    [queue, setQueue] = useState("all"),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState(""),
    [digital, setDigital] = useState(""),
    [reference, setReference] = useState(""),
    [assignedTo, setAssignedTo] = useState(""),
    [tab, setTab] = useState("orders")
  async function api(path: string, body?: unknown) {
    const r = await officeFetch(path, body ? { method: "POST", body: JSON.stringify(body) } : undefined),
      d = await r.json()
    if (!r.ok) throw Error(d.error || "Request failed")
    return d
  }
  async function load(before?: string) {
    try {
      const d = await api(
        `/api/admin/marketplace/orders?queue=${queue}${before ? `&before=${encodeURIComponent(before)}` : ""}`,
      )
      setData((old: any) => (before ? { ...d, orders: [...old.orders, ...d.orders] } : d))
    } catch (e) {
      setError((e as Error).message)
    }
  }
  async function select(id: string) {
    try {
      setSelected(await api(`/api/admin/marketplace/orders/${id}`))
      setNote("")
      setDigital("")
      setReference("")
    } catch (e) {
      setError((e as Error).message)
    }
  }
  useEffect(() => {
    void load()
  }, [queue])
  async function action(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true)
    setError("")
    try {
      await api(`/api/admin/marketplace/orders/${selected.order.id}/actions`, {
        action,
        note,
        digitalContent: digital,
        reference,
        ...extra,
      })
      await select(selected.order.id)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const o = selected?.order
  const filtered = data.orders
  return (
    <OfficeDashboardLayout>
      <div className="space-y-6 p-6">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="mr-auto text-2xl font-semibold">Marketplace operations</h1>
          <Button variant="outline" onClick={() => setTab("orders")}>
            Orders
          </Button>
          <Button variant="outline" onClick={() => setTab("catalog")}>
            Fulfillment configuration
          </Button>
          <Button onClick={() => void load()}>Refresh</Button>
        </header>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {tab === "catalog" ? (
          <MarketplaceCatalog />
        ) : (
          <>
            {!data.health?.last_completed_at ||
            Date.now() - Date.parse(data.health.last_completed_at) > 300000 ? (
              <p role="alert" className="rounded-xl bg-amber-50 p-4">
                Worker has not completed in the last 5 minutes. Check scheduler and API connectivity.
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Worker last completed: {new Date(data.health.last_completed_at).toLocaleString()}
              </p>
            )}
            <label>
              Queue{" "}
              <select className="rounded border p-2" value={queue} onChange={(e) => setQueue(e.target.value)}>
                {["all", "review", "acceptance", "fulfillment", "exceptions", "refunds", "overdue"].map(
                  (q) => (
                    <option key={q}>{q}</option>
                  ),
                )}
              </select>
            </label>
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="space-y-2">
                {filtered.map((o: any) => (
                  <button
                    key={o.id}
                    className="block w-full rounded-xl border p-4 text-left"
                    onClick={() => void select(o.id)}
                  >
                    <strong>{o.snapshot.title}</strong>
                    <p>
                      {o.public_id} · {o.line}
                    </p>
                    <p>
                      {o.payment_state.replaceAll("_", " ")} · {o.fulfillment_state.replaceAll("_", " ")}
                    </p>
                    {o.exception_reason && <p className="text-amber-800">{o.exception_reason}</p>}
                  </button>
                ))}
                {data.nextCursor && <Button onClick={() => void load(data.nextCursor)}>Load more</Button>}
              </section>
              {o && (
                <section className="space-y-4 rounded-xl border p-5">
                  <h2 className="text-xl font-semibold">{o.public_id}</h2>
                  <p>
                    {o.snapshot.totals.total} {o.snapshot.totals.payCurrency} · {o.fulfillment_mode}
                  </p>
                  <p>
                    {o.snapshot.contactName} · {o.snapshot.contactPhone} · {o.snapshot.contactEmail}
                  </p>
                  <p>{o.snapshot.deliveryAddressLine}</p>
                  <p>{o.snapshot.note}</p>
                  {o.snapshot.lines.map((l: any) => (
                    <p key={l.id}>
                      {l.quantity} × {l.title}
                    </p>
                  ))}
                  <p>
                    Owner: {o.owner_team}
                    {o.assigned_to ? ` · ${o.assigned_to}` : ""}
                  </p>
                  <label>
                    Assign operator ID
                    <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
                  </label>
                  <Button
                    disabled={busy}
                    variant="outline"
                    onClick={() => void action("assign", { assignedTo })}
                  >
                    Assign
                  </Button>
                  <label className="block">
                    Action note
                    <Input value={note} onChange={(e) => setNote(e.target.value)} />
                  </label>
                  <label className="block">
                    Payment/refund reference
                    <Input value={reference} onChange={(e) => setReference(e.target.value)} />
                  </label>
                  {o.attempts
                    .filter((a: any) => a.rail === "manual" && !["succeeded", "failed"].includes(a.state))
                    .map((a: any) => (
                      <div key={a.id} className="space-y-2 rounded border p-3">
                        <p>Manual payment · {a.state}</p>
                        {selected.proofs.find((p: any) => p.attemptId === a.id) && (
                          <a
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                            href={selected.proofs.find((p: any) => p.attemptId === a.id).url}
                          >
                            View proof
                          </a>
                        )}
                        <Button
                          disabled={busy || !reference.trim()}
                          onClick={() =>
                            void action("paid", {
                              attemptId: a.id,
                              amount: o.snapshot.totals.total,
                              currency: o.snapshot.totals.payCurrency,
                            })
                          }
                        >
                          Confirm exact payment received
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => void action("failed", { attemptId: a.id })}
                        >
                          Reject payment proof
                        </Button>
                      </div>
                    ))}
                  {o.exception_reason === "LATE_PAYMENT" && (
                    <Button disabled={busy} onClick={() => void action("reacquire")}>
                      Reacquire availability
                    </Button>
                  )}
                  {o.payment_state === "paid" && o.fulfillment_state === "awaiting_acceptance" && (
                    <Button disabled={busy || !!o.exception_reason} onClick={() => void action("accept")}>
                      Accept order
                    </Button>
                  )}
                  {o.fulfillment_state === "accepted" && (
                    <Button disabled={busy} onClick={() => void action("start")}>
                      Start fulfillment
                    </Button>
                  )}
                  {["accepted", "in_progress"].includes(o.fulfillment_state) && (
                    <>
                      {o.fulfillment_mode === "digital" && (
                        <label className="block">
                          Private delivery content
                          <textarea
                            className="block w-full rounded border p-3"
                            value={digital}
                            onChange={(e) => setDigital(e.target.value)}
                          />
                        </label>
                      )}
                      <Button
                        disabled={busy || !note || (o.fulfillment_mode === "digital" && !digital)}
                        onClick={() => void action("fulfill")}
                      >
                        Mark fulfilled
                      </Button>
                    </>
                  )}
                  {o.canCancel && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => void action("cancel", { reason: note })}
                    >
                      Cancel / reject order
                    </Button>
                  )}
                  {o.fulfillment_state === "cancelled" && (
                    <Button disabled={busy} variant="outline" onClick={() => void action("restock")}>
                      Restore returned stock
                    </Button>
                  )}
                  {selected.refunds.map((r: any) => (
                    <div key={r.id}>
                      <p>
                        Refund: {r.amount} {r.currency} · {r.state}
                      </p>
                      {r.state === "pending" && (
                        <Button
                          disabled={busy || !reference.trim()}
                          onClick={() =>
                            void action("refund", {
                              refundId: r.id,
                              amount: Number(r.amount),
                              currency: r.currency,
                            })
                          }
                        >
                          Record external refund completed
                        </Button>
                      )}
                    </div>
                  ))}
                  <ol className="space-y-2">
                    {o.events.map((e: any) => (
                      <li key={e.id}>
                        {e.message} <small>{new Date(e.created_at).toLocaleString()}</small>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
            <section>
              <h2 className="mb-3 font-semibold">Background job exceptions</h2>
              {data.jobs.map((j: any) => (
                <div key={j.id}>
                  {j.kind} · {j.state} · {j.attempts} attempts · {j.last_error}
                  {j.state === "failed" && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        void api(`/api/admin/marketplace/jobs/${j.id}/retry`, {})
                          .then(() => load())
                          .catch((e) => setError(e.message))
                      }
                    >
                      Retry job
                    </Button>
                  )}
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </OfficeDashboardLayout>
  )
}
