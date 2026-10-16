"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RelativeAge } from "@/components/merchants/relative-age"
import { api } from "@/components/merchants/merchant-lib"
import { usePermissions } from "@/lib/permissions"

interface Item {
  key: string
  label: string
  href: string
  permission: string
  limitHours: number
  load: () => Promise<{ count: number; oldest: string | null; partial?: boolean } | { error: string }>
}

const oldestOf = (dates: Array<string | null | undefined>) => {
  const t = dates.filter(Boolean).map((d) => new Date(d as string).getTime()).filter((n) => !isNaN(n))
  return t.length ? new Date(Math.min(...t)).toISOString() : null
}

/** Queues the signed-in role can work, counted from the same endpoints the queue pages use. No numbers are invented. */
const ITEMS: Item[] = [
  {
    key: "merchants", label: "Merchant applications in review", href: "/merchants", permission: "merchants.review", limitHours: 24,
    load: async () => {
      const r = await api<{ merchants: { submitted_at: string | null; created_at: string }[]; total: number }>("/api/admin/merchants?status=in_review&limit=100")
      if (!r.ok) return { error: r.error }
      return { count: r.data.total, oldest: oldestOf(r.data.merchants.map((m) => m.submitted_at ?? m.created_at)), partial: r.data.total > r.data.merchants.length }
    },
  },
  {
    key: "payouts", label: "Payouts waiting", href: "/finance/payouts", permission: "finance.manage", limitHours: 48,
    load: async () => {
      const r = await api<{ payouts: { requested_at: string }[]; total: number }>("/api/admin/payouts?limit=100")
      if (!r.ok) return { error: r.error }
      return { count: r.data.total, oldest: oldestOf(r.data.payouts.map((p) => p.requested_at)), partial: r.data.total > r.data.payouts.length }
    },
  },
]

type State = Record<string, { count: number; oldest: string | null; partial?: boolean } | { error: string } | undefined>

export function NeedsAction({ pendingTransactions }: { pendingTransactions?: number | null }) {
  const { ready, can, role } = usePermissions()
  const [state, setState] = useState<State>({})
  const items = ITEMS.filter((i) => can(i.permission))

  const load = useCallback(async () => {
    const entries = await Promise.all(items.map(async (i) => [i.key, await i.load()] as const))
    setState(Object.fromEntries(entries))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  useEffect(() => { if (ready) void load() }, [ready, load])

  if (!ready) return null

  const rows = items.map((i) => ({ item: i, s: state[i.key] }))
  const txRow = can("support.read") && typeof pendingTransactions === "number"
  const loaded = rows.every((r) => r.s)
  const open = rows.reduce((n, r) => n + (r.s && "count" in r.s ? r.s.count : 0), 0) + (txRow ? pendingTransactions! : 0)
  const hasErrors = rows.some((r) => r.s && "error" in r.s)

  if (rows.length === 0 && !txRow) return null

  return (
    <Card data-testid="needs-action">
      <CardHeader>
        <CardTitle>Needs action</CardTitle>
        <CardDescription>Work waiting for your role, oldest first.</CardDescription>
      </CardHeader>
      <CardContent>
        {loaded && !hasErrors && open === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
            All clear. Nothing is waiting for you right now.
          </div>
        ) : (
          <ul className="divide-y text-sm">
            {rows.map(({ item, s }) => (
              <li key={item.key} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="font-medium">{item.label}</span>
                <span className="flex items-center gap-3">
                  {!s ? <span className="text-muted-foreground">Loading...</span>
                    : "error" in s ? (
                      <>
                        <span className="text-destructive-text">Could not load</span>
                        <Button variant="outline" size="sm" onClick={load}>Try again</Button>
                      </>
                    ) : (
                      <>
                        <span className="tabular-nums">{s.count}</span>
                        {s.count > 0 ? <RelativeAge iso={s.oldest} warn limitHours={item.limitHours} /> : null}
                        {s.count > 0 ? <Link href={item.href} className="text-primary-text hover:underline">Open queue</Link> : <span className="text-muted-foreground">Clear</span>}
                      </>
                    )}
                </span>
              </li>
            ))}
            {txRow && (
              <li className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="font-medium">Transactions pending</span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums">{pendingTransactions}</span>
                  {pendingTransactions! > 0 ? <Link href="/transactions" className="text-primary-text hover:underline">Open queue</Link> : <span className="text-muted-foreground">Clear</span>}
                </span>
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
