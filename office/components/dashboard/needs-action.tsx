"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RelativeAge } from "@/components/merchants/relative-age"
import { hoursLabel } from "@/components/office/sla-chip"
import { useQueues, type QueueKey } from "@/lib/office-queues"
import { usePermissions } from "@/lib/permissions"

const ROWS: Array<{ key: QueueKey; label: string; href: string }> = [
  { key: "merchants", label: "Merchant applications in review", href: "/merchants" },
  { key: "listings", label: "Listings in review", href: "/catalog-review" },
  { key: "payouts", label: "Payouts waiting", href: "/finance/payouts" },
  { key: "kyc", label: "KYC waiting", href: "/kyc" },
  { key: "support", label: "Support requests waiting", href: "/assistant" },
  { key: "transactions", label: "Transactions pending", href: "/transactions" },
]

/**
 * Work waiting for the signed-in role, oldest first. Counts are exact and come from `GET /api/admin/queues`, which only
 * returns the queues the role may work, so this card and the sidebar badges always agree. No numbers are invented.
 */
export function NeedsAction() {
  const { ready: permsReady } = usePermissions()
  const { queues, ready, error, refresh } = useQueues()

  if (!permsReady) return null
  const rows = ROWS.filter((r) => queues[r.key]).map((r) => ({ ...r, q: queues[r.key]! }))
  const open = rows.reduce((n, r) => n + (r.q.unavailable ? 0 : r.q.count), 0)
  const anyUnavailable = rows.some((r) => r.q.unavailable)
  if (ready && rows.length === 0) return null

  return (
    <Card data-testid="needs-action">
      <CardHeader>
        <CardTitle>Needs action</CardTitle>
        <CardDescription>Work waiting for your role. Oldest item and target shown for each queue.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-destructive-text">Could not load the queues.</span>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>Try again</Button>
          </div>
        ) : !ready ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : open === 0 && !anyUnavailable ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
            All clear. Nothing is waiting for you right now.
          </div>
        ) : (
          <ul className="divide-y text-sm">
            {rows.map(({ key, label, href, q }) => (
              <li key={key} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="font-medium">{label}</span>
                <span className="flex items-center gap-3">
                  {q.unavailable ? (
                    <span className="text-muted-foreground">Not available yet</span>
                  ) : (
                    <>
                      <span className="tabular-nums" data-testid={`needs-${key}`}>{q.count}</span>
                      {q.count > 0 && q.limit_hours !== null ? <RelativeAge iso={q.oldest} warn limitHours={q.limit_hours} /> : null}
                      {q.count > 0 && q.limit_hours === null ? <RelativeAge iso={q.oldest} /> : null}
                      {q.over_sla ? <span className="rounded-full bg-destructive-surface px-2 py-0.5 text-xs font-medium text-destructive-text">{q.over_sla} over {q.limit_hours !== null ? hoursLabel(q.limit_hours) : "target"}</span> : null}
                      {q.count > 0 ? <Link href={href} className="text-primary-text hover:underline">Open queue</Link> : <span className="text-muted-foreground">Clear</span>}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
