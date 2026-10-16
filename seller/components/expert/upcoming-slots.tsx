"use client"
import * as React from "react"
import Link from "next/link"
import { Ban, RotateCcw, Trash2 } from "lucide-react"
import { Banner, Button, Card, CardHeader, ConfirmDialog, EmptyState, Select, Skeleton, StatusBadge, useToast } from "@ciuna/ui-web"
import { api } from "@/lib/api"
import { invalidate, useQuery } from "@/lib/query"
import { useT } from "@/lib/i18n"
import { formatDateInZone, formatTimeRange, groupByDate } from "./logic"
import { intlLocale, useExpertError, type Slot } from "./shared"

export function UpcomingSlots({ serviceId, zone, refreshToken }: { serviceId: string; zone: string; refreshToken: number }) {
  const { t, locale } = useT()
  const toast = useToast()
  const errText = useExpertError()
  const [days, setDays] = React.useState(14)
  const { data, error, loading, reload } = useQuery<{ slots: Slot[] }>(`expert/slots/${serviceId}/${days}/${refreshToken}`, () => {
    const from = new Date()
    const to = new Date(from.getTime() + days * 86_400_000)
    return api(`/api/merchant/expert/services/${serviceId}/slots?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`)
  })
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [del, setDel] = React.useState<Slot | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)

  async function setStatus(s: Slot, status: "available" | "blocked") {
    setBusyId(s.id)
    setMessage(null)
    try {
      await api(`/api/merchant/expert/services/${serviceId}/slots/${s.id}`, { method: "PATCH", json: { status } })
      invalidate("expert/")
      await reload()
    } catch (e) {
      setMessage(errText(e))
      await reload()
    } finally {
      setBusyId(null)
    }
  }
  async function remove(s: Slot) {
    setBusyId(s.id)
    setMessage(null)
    try {
      await api(`/api/merchant/expert/services/${serviceId}/slots/${s.id}`, { method: "DELETE" })
      invalidate("expert/")
      await reload()
      toast.show(t("expert.slots.deleted"))
    } catch (e) {
      setMessage(errText(e))
      await reload()
    } finally {
      setBusyId(null)
      setDel(null)
    }
  }

  const items = (data?.slots ?? []).map((s) => ({ ...s, start: s.slot_start }))
  const groups = groupByDate(items, zone)
  const loc = intlLocale(locale)

  return (
    <Card>
      <CardHeader title={t("expert.slots.title")} description={t("expert.slots.hint", { zone })} action={
        <Select aria-label={t("expert.slots.range")} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-36">
          {[14, 30, 60].map((d) => <option key={d} value={d}>{t("expert.slots.next", { count: d })}</option>)}
        </Select>
      } />
      <div className="p-4 sm:p-5">
        {message ? <div className="mb-3"><Banner tone="destructive" title={message} /></div> : null}
        {loading ? <div className="space-y-2"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
          : error && !data ? <Banner tone="destructive" title={errText(error)} action={<Button size="sm" variant="secondary" onClick={() => void reload()}>{t("action.retry")}</Button>} />
          : groups.length === 0 ? <EmptyState title={t("expert.slots.empty")} description={t("expert.slots.empty.body")} />
          : (
            <div className="space-y-5">
              {groups.map((g) => (
                <section key={g.date}>
                  <h3 className="mb-2 text-sm font-semibold">{formatDateInZone(g.items[0].slot_start, zone, loc, { weekday: "long", day: "numeric", month: "long" })}</h3>
                  <ul className="space-y-2">
                    {g.items.map((s) => (
                      <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-hairline px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="text-[15px] font-medium tabular-nums">{formatTimeRange(s.slot_start, s.slot_end, zone, loc)}</span>
                          <StatusBadge status={s.status === "available" ? "approved" : s.status === "booked" ? "pending" : "paused"} label={t(`expert.slots.status.${s.status}`)} />
                        </div>
                        <div className="flex gap-1">
                          {s.status === "booked" ? <Button asChild size="sm" variant="ghost"><Link href="/bookings">{t("expert.slots.view_booking")}</Link></Button> : (
                            <>
                              {s.status === "available"
                                ? <Button size="sm" variant="secondary" busy={busyId === s.id} onClick={() => setStatus(s, "blocked")}><Ban />{t("expert.slots.block")}</Button>
                                : <Button size="sm" variant="secondary" busy={busyId === s.id} onClick={() => setStatus(s, "available")}><RotateCcw />{t("expert.slots.unblock")}</Button>}
                              <Button size="sm" variant="ghost" aria-label={t("action.remove")} disabled={busyId === s.id} onClick={() => setDel(s)}><Trash2 /></Button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
      </div>
      <ConfirmDialog open={Boolean(del)} onOpenChange={(o) => !o && setDel(null)} title={t("expert.slots.delete.title")} description={del ? formatTimeRange(del.slot_start, del.slot_end, zone, loc) : undefined} confirmLabel={t("expert.slots.delete.action")} cancelLabel={t("action.cancel")} destructive busy={Boolean(del && busyId === del.id)} onConfirm={() => del && remove(del)} />
    </Card>
  )
}
