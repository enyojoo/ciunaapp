"use client"
import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Mail, Phone, Video } from "lucide-react"
import { Amount, Banner, Button, Card, CardBody, CardHeader, ConfirmDialog, Field, Input, PageHeader, Skeleton, StatusBadge, Textarea, useToast } from "@ciuna/ui-web"
import { api } from "@/lib/api"
import { invalidate, useQuery } from "@/lib/query"
import { useT } from "@/lib/i18n"
import { BookingTime } from "@/components/expert/booking-time"
import { ExpertOnly, bookingStatusLabel, useExpertError, type Booking } from "@/components/expert/shared"
import { formatInZone, isHttps, sessionEnded, browserTimeZone } from "@/components/expert/logic"

interface Detail {
  order: Omit<Booking, "serviceTitle" | "customerName" | "totals"> & {
    title: string | null
    items: Array<{ id: string; title: string; quantity: number }>
    totals: { currency: string; subtotal: number } | null
    customer: { name: string | null; phone: string | null; email: string | null }
    note: string | null
  }
  events: Array<{ id: string; kind: string; created_at: string; message: string | null }>
}

export default function BookingDetailPage() {
  return <ExpertOnly><BookingDetail /></ExpertOnly>
}

/** The meeting event message is "<url>\n<instructions>"; split it back for the form. */
function parseMeeting(message: string | null | undefined) {
  const lines = (message ?? "").split("\n")
  if (lines[0]?.startsWith("https://")) return { url: lines[0], instructions: lines.slice(1).join("\n") }
  return { url: "", instructions: message ?? "" }
}

function BookingDetail() {
  const { t } = useT()
  const toast = useToast()
  const errText = useExpertError()
  const { id } = useParams<{ id: string }>()
  const { data, error, loading, reload } = useQuery<Detail>(`expert/booking/${id}`, () => api(`/api/merchant/orders/${id}`), { refreshMs: 30_000 })
  const order = data?.order
  const [now, setNow] = React.useState(() => new Date())
  React.useEffect(() => { const i = setInterval(() => setNow(new Date()), 15_000); return () => clearInterval(i) }, [])

  const [sheet, setSheet] = React.useState<null | "reject" | "fulfill">(null)
  const [text, setText] = React.useState("")
  const [tried, setTried] = React.useState(false)
  const [busy, setBusy] = React.useState<null | "accept" | "reject" | "fulfill">(null)
  const [message, setMessage] = React.useState<string | null>(null)

  const meeting = React.useMemo(() => parseMeeting(data?.events.find((e) => e.kind === "meeting_link")?.message), [data])
  const [url, setUrl] = React.useState("")
  const [instr, setInstr] = React.useState("")
  const [meetBusy, setMeetBusy] = React.useState(false)
  const [meetTried, setMeetTried] = React.useState(false)
  const [meetMsg, setMeetMsg] = React.useState<{ tone: "success" | "destructive"; text: string } | null>(null)
  const seeded = React.useRef(false)
  React.useEffect(() => {
    if (data && !seeded.current) { seeded.current = true; setUrl(meeting.url); setInstr(meeting.instructions) }
  }, [data, meeting])

  async function act(action: "accept" | "reject" | "fulfill") {
    setTried(true)
    setMessage(null)
    const payload: Record<string, unknown> = { action }
    if (action === "reject") { if (text.trim().length < 3) return; payload.reason = text.trim() }
    if (action === "fulfill") { if (!text.trim()) return; payload.note = text.trim() }
    setBusy(action)
    try {
      await api(`/api/merchant/orders/${id}/actions`, { method: "POST", json: payload })
      invalidate("expert/")
      invalidate("orders")
      await reload()
      setSheet(null)
      setText("")
      setTried(false)
      toast.show(t(`expert.detail.done.${action}`))
    } catch (e) {
      setSheet(null)
      setMessage(errText(e))
      window.scrollTo({ top: 0, behavior: "smooth" })
      await reload()
    } finally {
      setBusy(null)
    }
  }

  async function saveMeeting() {
    setMeetTried(true)
    setMeetMsg(null)
    if ((url.trim() && !isHttps(url)) || (!url.trim() && !instr.trim())) return
    setMeetBusy(true)
    try {
      await api(`/api/merchant/expert/bookings/${id}/meeting`, { method: "PUT", json: { meetingUrl: url.trim() || null, instructions: instr.trim() || null } })
      invalidate("expert/")
      setMeetMsg({ tone: "success", text: t("expert.detail.meeting.saved") })
      await reload()
    } catch (e) {
      setMeetMsg({ tone: "destructive", text: errText(e) })
    } finally {
      setMeetBusy(false)
    }
  }

  const back = <Link href="/bookings" className="inline-flex h-12 items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" />{t("expert.bookings.title")}</Link>

  if (!order) {
    return (
      <div>
        <PageHeader back={back} title={t("expert.detail.title")} />
        {loading ? <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-40" /></div>
          : <Banner tone="destructive" title={errText(error)} action={<Button size="sm" variant="secondary" onClick={() => void reload()}>{t("action.retry")}</Button>} />}
      </div>
    )
  }

  const ended = sessionEnded(order.slot?.end, now)
  const canAccept = order.actions.includes("accept")
  const canReject = order.actions.includes("reject")
  const canFulfill = order.actions.includes("fulfill")
  const showMeeting = order.status === "accepted" || order.status === "preparing"
  const zone = order.slot?.timezone || browserTimeZone()
  const urlBad = meetTried && url.trim() && !isHttps(url)
  const meetEmpty = meetTried && !url.trim() && !instr.trim()

  return (
    <div className="pb-8">
      <PageHeader back={back} title={order.title ?? t("expert.bookings.session")} description={`#${order.publicId}`} action={<StatusBadge status={order.status} label={bookingStatusLabel(t, order)} />} />
      <div className="mx-auto max-w-2xl space-y-4">
        {message ? <Banner tone="destructive" title={message} /> : null}
        {order.exception ? <Banner tone="warning" title={t("expert.detail.exception")}>{order.exception}</Banner> : null}
        {order.status === "new" && order.dueAt ? <Banner tone={order.overdue ? "warning" : "neutral"} title={t(order.overdue ? "expert.bookings.overdue" : "expert.bookings.respond_by", { time: formatInZone(order.dueAt, zone) })} /> : null}

        <Card>
          <CardHeader title={t("expert.detail.session")} />
          <CardBody className="space-y-3">
            <BookingTime slot={order.slot} />
            {order.totals ? <p className="text-sm text-muted">{t("expert.detail.price")}: <Amount value={order.totals.subtotal} currency={order.totals.currency} className="font-semibold text-ink" /></p> : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("expert.detail.customer")} />
          <CardBody className="space-y-2">
            <p className="font-semibold">{order.customer.name ?? t("expert.bookings.customer")}</p>
            {order.customer.email ? <a href={`mailto:${order.customer.email}`} className="flex min-h-12 items-center gap-2 text-[15px] text-primary-text underline-offset-4 hover:underline"><Mail className="size-4" />{order.customer.email}</a> : null}
            {order.customer.phone ? <a href={`tel:${order.customer.phone}`} className="flex min-h-12 items-center gap-2 text-[15px] text-primary-text underline-offset-4 hover:underline"><Phone className="size-4" />{order.customer.phone}</a> : null}
            {order.note ? <div className="mt-2 rounded-xl bg-neutral-surface p-3"><p className="text-sm font-semibold">{t("expert.detail.note")}</p><p className="mt-1 whitespace-pre-wrap text-[15px]">{order.note}</p></div> : null}
          </CardBody>
        </Card>

        {showMeeting ? (
          <Card>
            <CardHeader title={t("expert.detail.meeting")} description={t("expert.detail.meeting.hint")} />
            <CardBody className="space-y-4">
              {meetMsg ? <Banner tone={meetMsg.tone} title={meetMsg.text} /> : null}
              <Field label={t("expert.detail.meeting.url")} error={urlBad ? t("expert.detail.meeting.url.err") : null}>
                <Input type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
              </Field>
              <Field label={t("expert.detail.meeting.instructions")} error={meetEmpty ? t("errors.MEETING_EMPTY") : null}>
                <Textarea rows={3} value={instr} onChange={(e) => setInstr(e.target.value)} maxLength={2000} />
              </Field>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" onClick={saveMeeting} busy={meetBusy}><Video />{t("expert.detail.meeting.save")}</Button>
                {meeting.url ? <a href={meeting.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary-text underline-offset-4 hover:underline">{t("expert.detail.meeting.open")}</a> : null}
              </div>
            </CardBody>
          </Card>
        ) : null}

        {canAccept || canReject || canFulfill ? (
          <Card>
            <CardBody className="space-y-3">
              {canAccept ? <Button size="lg" className="w-full" onClick={() => act("accept")} busy={busy === "accept"}>{t("expert.bookings.accept")}</Button> : null}
              {canFulfill ? (
                <>
                  <Button size="lg" className="w-full" disabled={!ended} onClick={() => { setText(""); setTried(false); setSheet("fulfill") }}>{t("expert.detail.fulfill")}</Button>
                  {!ended && order.slot ? <p className="text-sm text-muted">{t("expert.detail.fulfill.wait", { time: formatInZone(order.slot.end, zone) })}</p> : null}
                </>
              ) : null}
              {canReject ? <Button size="lg" variant="secondary" className="w-full" onClick={() => { setText(""); setTried(false); setSheet("reject") }}>{t("expert.detail.reject")}</Button> : null}
            </CardBody>
          </Card>
        ) : null}
      </div>

      <ConfirmDialog
        open={sheet === "reject"}
        onOpenChange={(o) => !o && setSheet(null)}
        title={t("expert.detail.reject.title")}
        description={t("expert.detail.reject.body")}
        confirmLabel={t("expert.detail.reject.confirm")}
        cancelLabel={t("action.cancel")}
        destructive
        busy={busy === "reject"}
        onConfirm={() => act("reject")}
      >
        <Field label={t("expert.detail.reject.reason")} required error={tried && text.trim().length < 3 ? t("errors.REASON_REQUIRED") : null}>
          <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={sheet === "fulfill"}
        onOpenChange={(o) => !o && setSheet(null)}
        title={t("expert.detail.fulfill.title")}
        description={t("expert.detail.fulfill.body")}
        confirmLabel={t("expert.detail.fulfill")}
        cancelLabel={t("action.cancel")}
        busy={busy === "fulfill"}
        onConfirm={() => act("fulfill")}
      >
        <Field label={t("expert.detail.fulfill.note")} required error={tried && !text.trim() ? t("errors.NOTE_REQUIRED") : null}>
          <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
        </Field>
      </ConfirmDialog>
    </div>
  )
}
