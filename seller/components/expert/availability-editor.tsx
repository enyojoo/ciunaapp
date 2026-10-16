"use client"
import * as React from "react"
import { Copy, Plus, Trash2 } from "lucide-react"
import { Banner, Button, Card, CardBody, CardHeader, Field, Input, Select, Sheet, useToast } from "@ciuna/ui-web"
import { api } from "@/lib/api"
import { invalidate } from "@/lib/query"
import { useT } from "@/lib/i18n"
import { cn } from "@ciuna/ui-web"
import { DAY_ORDER, MAX_WINDOW_DAYS, addDaysISO, browserTimeZone, copyDay, dateKeyInZone, defaultWindow, emptyWeek, formatDateInZone, formatTimeRange, groupByDate, rulesFromWeek, timeZoneList, validateWeek, validateWindow, weekFromRules, windowDays, type ApiRule, type WeekRanges } from "./logic"
import { intlLocale, useExpertError, type ExpertService } from "./shared"

export interface ScheduleData {
  schedule: { timezone: string; window_start_date: string; window_end_date: string; slot_duration_minutes: number | null } | null
  weekly_rules: ApiRule[]
  preview: Array<{ start: string; end: string }>
  inserted?: number
}

const SLOT_LENGTHS = [15, 30, 45, 60, 90, 120, 180]

export function dayName(d: number, locale: string) {
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + d)))
}

export function AvailabilityEditor({ service, data, onSaved }: { service: ExpertService; data: ScheduleData | undefined; onSaved: (d: ScheduleData) => void }) {
  const { t, locale } = useT()
  const toast = useToast()
  const errText = useExpertError()
  const sched = data?.schedule ?? null

  const init = React.useMemo(() => {
    const zone = sched?.timezone ?? (service.timezone && service.timezone !== "UTC" ? service.timezone : browserTimeZone())
    const win = sched ? { start: sched.window_start_date, end: sched.window_end_date } : defaultWindow(zone)
    return {
      zone,
      start: win.start,
      end: win.end,
      slot: sched?.slot_duration_minutes ?? service.default_duration_minutes ?? 60,
      week: weekFromRules(data?.weekly_rules ?? []),
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service.id])

  const startRef = React.useRef(JSON.stringify(init))
  const [zone, setZone] = React.useState(init.zone)
  const [start, setStart] = React.useState(init.start)
  const [end, setEnd] = React.useState(init.end)
  const [slot, setSlot] = React.useState(init.slot)
  const [week, setWeek] = React.useState<WeekRanges>(init.week)
  const [copyFrom, setCopyFrom] = React.useState<number | null>(null)
  const [copyTo, setCopyTo] = React.useState<number[]>([])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState<ScheduleData | null>(null)
  const [tried, setTried] = React.useState(false)

  const dirty = JSON.stringify({ zone, start, end, slot, week }) !== startRef.current
  React.useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [dirty])

  const zones = React.useMemo(() => timeZoneList(zone), [zone])
  const issues = validateWeek(week)
  const winIssue = validateWindow(start, end)
  const hasRules = DAY_ORDER.some((d) => (week[d] ?? []).length > 0)
  const valid = Object.keys(issues).length === 0 && !winIssue
  const lengths = SLOT_LENGTHS.includes(slot) ? SLOT_LENGTHS : [...SLOT_LENGTHS, slot].sort((a, b) => a - b)

  const setRange = (d: number, i: number, patch: Partial<{ start: string; end: string }>) =>
    setWeek((w) => ({ ...w, [d]: (w[d] ?? []).map((r, j) => (j === i ? { ...r, ...patch } : r)) }))
  const addRange = (d: number) =>
    setWeek((w) => {
      const last = (w[d] ?? [])[(w[d] ?? []).length - 1]
      const s = last ? last.end : "09:00"
      const eH = Math.min(23, Number(s.slice(0, 2)) + 3)
      return { ...w, [d]: [...(w[d] ?? []), { start: s, end: last && s >= "21:00" ? "23:59" : `${String(eH).padStart(2, "0")}:${s.slice(3)}` }] }
    })
  const removeRange = (d: number, i: number) => setWeek((w) => ({ ...w, [d]: (w[d] ?? []).filter((_, j) => j !== i) }))

  async function save() {
    setTried(true)
    setError(null)
    if (!valid) return
    setBusy(true)
    try {
      const res = await api<ScheduleData>(`/api/merchant/expert/services/${service.id}/schedule`, {
        method: "PATCH",
        json: { timezone: zone, window_start_date: start, window_end_date: end, slot_duration_minutes: slot, weekly_rules: rulesFromWeek(week) },
      })
      invalidate("expert/")
      startRef.current = JSON.stringify({ zone, start, end, slot, week })
      setPreview(res)
      onSaved(res)
      toast.show(t("expert.avail.saved"))
    } catch (e) {
      setError(errText(e))
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setBusy(false)
    }
  }

  const issueText = (v: string) => t(`expert.avail.issue.${v}`)
  const groups = preview ? groupByDate(preview.preview, zone) : []
  const maxEnd = addDaysISO(start || dateKeyInZone(new Date(), zone), MAX_WINDOW_DAYS - 1)

  return (
    <div className="space-y-4 pb-28">
      {error ? <Banner tone="destructive" title={error} /> : null}

      <Card>
        <CardHeader title={t("expert.avail.settings")} />
        <CardBody className="space-y-4">
          <Field label={t("expert.avail.timezone")} hint={t("expert.avail.timezone.hint")}>
            <Select value={zone} onChange={(e) => setZone(e.target.value)}>{zones.map((z) => <option key={z} value={z}>{z}</option>)}</Select>
          </Field>
          <Field label={t("expert.avail.slot")} hint={t("expert.avail.slot.hint")}>
            <Select value={slot} onChange={(e) => setSlot(Number(e.target.value))}>{lengths.map((m) => <option key={m} value={m}>{m} {t("expert.unit.min")}</option>)}</Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("expert.avail.window.start")} error={tried && winIssue === "empty" ? t("expert.avail.issue.empty") : null}>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label={t("expert.avail.window.end")} error={tried && winIssue && winIssue !== "empty" ? t(winIssue === "order" ? "expert.avail.window.order" : "expert.avail.window.long", { max: MAX_WINDOW_DAYS }) : null}>
              <Input type="date" value={end} min={start} max={maxEnd} onChange={(e) => setEnd(e.target.value)} />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted">{!winIssue ? t("expert.avail.window.days", { count: windowDays(start, end), max: MAX_WINDOW_DAYS }) : t("expert.avail.window.max", { max: MAX_WINDOW_DAYS })}</p>
            <Button size="sm" variant="secondary" onClick={() => { const w = defaultWindow(zone); setStart(w.start); setEnd(w.end) }}>{t("expert.avail.window.reset")}</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("expert.avail.weekly")} description={t("expert.avail.weekly.hint", { zone })} />
        <div className="divide-y divide-hairline">
          {DAY_ORDER.map((d) => {
            const ranges = week[d] ?? []
            return (
              <div key={d} className="px-4 py-3.5 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold">{dayName(d, locale)}</h3>
                  <div className="flex flex-wrap gap-1">
                    {ranges.length > 0 ? <Button size="sm" variant="ghost" onClick={() => { setCopyFrom(d); setCopyTo([]) }}><Copy />{t("expert.avail.copy")}</Button> : null}
                    <Button size="sm" variant="secondary" onClick={() => addRange(d)}><Plus />{t("expert.avail.add")}</Button>
                  </div>
                </div>
                {ranges.length === 0 ? <p className="mt-1 text-sm text-muted">{t("expert.avail.closed")}</p> : null}
                <ul className="mt-2 space-y-2">
                  {ranges.map((r, i) => {
                    const issue = issues[`${d}:${i}`]
                    return (
                      <li key={i}>
                        <div className="flex items-center gap-2">
                          <Input type="time" aria-label={t("expert.avail.from")} value={r.start} onChange={(e) => setRange(d, i, { start: e.target.value })} aria-invalid={issue ? true : undefined} className="min-w-0 flex-1" />
                          <span aria-hidden className="text-muted">{"–"}</span>
                          <Input type="time" aria-label={t("expert.avail.to")} value={r.end} onChange={(e) => setRange(d, i, { end: e.target.value })} aria-invalid={issue ? true : undefined} className="min-w-0 flex-1" />
                          <Button size="icon" variant="ghost" aria-label={t("action.remove")} onClick={() => removeRange(d, i)}><Trash2 /></Button>
                        </div>
                        {issue ? <p role="alert" className="mt-1 text-sm text-destructive-text">{issueText(issue)}</p> : null}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
        {!hasRules ? <div className="border-t border-hairline px-4 py-3 text-sm text-muted sm:px-5">{t("expert.avail.norules")}</div> : null}
      </Card>

      {preview ? (
        <Card>
          <CardHeader title={t("expert.avail.preview")} description={t("expert.avail.preview.hint", { zone, count: preview.inserted ?? preview.preview.length })} />
          <CardBody className="space-y-4">
            {groups.length === 0 ? <p className="text-sm text-muted">{t("expert.avail.preview.empty")}</p> : groups.map((g) => (
              <div key={g.date}>
                <h3 className="text-sm font-semibold">{formatDateInZone(g.items[0].start, zone, intlLocale(locale), { weekday: "long", day: "numeric", month: "long" })}</h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {g.items.map((s) => <span key={s.start} className="rounded-lg bg-neutral-surface px-2.5 py-1 text-sm tabular-nums">{formatTimeRange(s.start, s.end, zone, intlLocale(locale))}</span>)}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-hairline bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-[248px]">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3">
          <p className={cn("hidden min-w-0 flex-1 truncate text-sm sm:block", tried && !valid ? "text-destructive-text" : "text-muted")} aria-live="polite">{tried && !valid ? t("expert.avail.fix") : dirty ? t("expert.form.unsaved") : t("expert.avail.saves_note")}</p>
          <Button className="ml-auto w-full sm:w-auto" onClick={save} busy={busy} disabled={!dirty && Boolean(sched)}>{t("expert.avail.save")}</Button>
        </div>
      </div>

      <Sheet
        open={copyFrom !== null}
        onOpenChange={(o) => !o && setCopyFrom(null)}
        title={copyFrom !== null ? t("expert.avail.copy.title", { day: dayName(copyFrom, locale) }) : ""}
        description={t("expert.avail.copy.hint")}
        footer={<><Button variant="secondary" onClick={() => setCopyFrom(null)}>{t("action.cancel")}</Button><Button disabled={copyTo.length === 0} onClick={() => { if (copyFrom !== null) setWeek((w) => copyDay(w, copyFrom, copyTo)); setCopyFrom(null) }}>{t("expert.avail.copy.apply")}</Button></>}
      >
        <div className="space-y-1">
          {DAY_ORDER.filter((d) => d !== copyFrom).map((d) => (
            <label key={d} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-2 hover:bg-neutral-surface">
              <input type="checkbox" className="size-5 accent-primary" checked={copyTo.includes(d)} onChange={(e) => setCopyTo((c) => (e.target.checked ? [...c, d] : c.filter((x) => x !== d)))} />
              <span className="text-[15px]">{dayName(d, locale)}</span>
            </label>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
