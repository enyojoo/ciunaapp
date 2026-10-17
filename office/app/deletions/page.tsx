"use client"

import { useCallback, useEffect, useState } from "react"
import { OfficeDashboardLayout } from "@/components/layout/office-dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api, formatDateTime } from "@/components/merchants/merchant-lib"
import { usePermissions } from "@/lib/permissions"

interface Row { user_id: string; reason: string | null; requested_at: string; purge_after: string; customer: { name: string | null; email: string | null } }

export default function DeletionsPage() {
  const { can } = usePermissions()
  const canManage = can("users.manage")
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await api<{ deletions: Row[] }>("/api/admin/account-deletions")
    if (res.ok) { setRows(res.data.deletions); setError(null) } else setError(res.error)
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])

  const restore = async (id: string) => {
    setBusy(id); setError(null)
    const res = await api(`/api/admin/account-deletions/${id}`, { method: "POST" })
    setBusy(null)
    if (res.ok) await load(); else setError(res.error)
  }

  return (
    <OfficeDashboardLayout>
      <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Account deletions</h1>
          <p className="text-sm text-muted-foreground">Accounts closed by the customer. Personal data is removed on the date shown. Restore one before then if the customer changed their mind.</p>
        </div>
        {error ? <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? <Card className="p-4 text-sm text-muted-foreground">No accounts are waiting to be deleted.</Card> : rows.map((r) => (
          <Card key={r.user_id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{r.customer.name || "No name"} <span className="font-normal text-muted-foreground">{r.customer.email}</span></p>
              <p className="text-xs text-muted-foreground">Asked {formatDateTime(r.requested_at)}. Data removed {formatDateTime(r.purge_after)}.</p>
              {r.reason ? <p className="mt-1 text-sm">Reason: {r.reason}</p> : null}
            </div>
            {canManage ? <Button size="sm" variant="outline" disabled={busy === r.user_id} onClick={() => void restore(r.user_id)}>{busy === r.user_id ? "Restoring…" : "Restore"}</Button> : null}
          </Card>
        ))}
      </div>
    </OfficeDashboardLayout>
  )
}
