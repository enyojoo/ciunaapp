"use client"
import * as React from "react"
import { Button, Field, Sheet, Textarea, cn } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import { formatMoneyDisplay } from "@ciuna/shared"
import { useOrderAction } from "./use-order-action"
import { orderTotal, type SellerOrder } from "./format"

/** Detail action bar. Shows only the actions the API lists. Sticky above the bottom nav on phones. */
export function OrderActions({ order, onDone }: { order: SellerOrder; onDone: (o: SellerOrder) => void }) {
  const { t } = useT()
  const { run, busy } = useOrderAction()
  const [sheet, setSheet] = React.useState<"reject" | "fulfill" | null>(null)
  const [reason, setReason] = React.useState("")
  const [note, setNote] = React.useState("")
  const [content, setContent] = React.useState("")
  const [touched, setTouched] = React.useState(false)
  const digital = order.fulfillmentMode === "digital"
  const has = (a: string) => (order.actions as string[]).includes(a)
  if (!order.actions.length) return null

  const close = () => { setSheet(null); setTouched(false) }
  const reasonOk = reason.trim().length >= 3
  const fulfillOk = note.trim().length > 0 && (!digital || content.trim().length > 0)

  async function instant(a: "accept" | "start") {
    const r = await run(order.id, a)
    if (r.ok) onDone(r.order)
  }
  async function reject() {
    setTouched(true)
    if (!reasonOk) return
    const r = await run(order.id, "reject", { reason: reason.trim() })
    if (r.ok) { close(); setReason(""); onDone(r.order) }
  }
  async function fulfill() {
    setTouched(true)
    if (!fulfillOk) return
    const r = await run(order.id, "fulfill", { note: note.trim(), ...(digital ? { digitalContent: content.trim() } : {}) })
    if (r.ok) { close(); setNote(""); setContent(""); onDone(r.order) }
  }

  const sticky = "fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-hairline bg-white px-4 py-3 md:static md:z-auto md:border-0 md:bg-transparent md:p-0"
  return (
    <>
      <div className={cn(sticky)}>
        <div className="mx-auto flex max-w-[1100px] gap-2 md:flex-wrap md:justify-end [&>button]:flex-1 md:[&>button]:flex-none">
          {has("accept") ? <Button size="lg" className="min-h-12" busy={busy === `${order.id}:accept`} onClick={() => instant("accept")}>{t("orders.action.accept")}</Button> : null}
          {has("start") ? <Button size="lg" className="min-h-12" busy={busy === `${order.id}:start`} onClick={() => instant("start")}>{t("orders.action.start")}</Button> : null}
          {has("fulfill") ? <Button size="lg" className="min-h-12" variant={has("start") ? "secondary" : "default"} onClick={() => setSheet("fulfill")}>{t("orders.action.fulfill")}</Button> : null}
          {has("reject") ? <Button size="lg" className="order-first min-h-12 md:order-none" variant="secondary" onClick={() => setSheet("reject")}>{t("orders.action.reject")}</Button> : null}
        </div>
      </div>

      <Sheet
        open={sheet === "reject"}
        onOpenChange={(o) => !o && close()}
        title={t("orders.reject.title")}
        description={order.totals ? t("orders.reject.bodyRefund", { amount: formatMoneyDisplay(orderTotal(order), order.totals.currency) }) : t("orders.reject.body")}
        footer={
          <>
            <Button variant="secondary" size="lg" onClick={close} disabled={busy !== null}>{t("action.cancel")}</Button>
            <Button variant="destructive" size="lg" onClick={reject} busy={busy === `${order.id}:reject`}>{t("orders.reject.confirm")}</Button>
          </>
        }
      >
        <Field label={t("orders.reject.reason")} required error={touched && !reasonOk ? t("errors.REASON_REQUIRED") : null}>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder={t("orders.reject.placeholder")} />
        </Field>
      </Sheet>

      <Sheet
        open={sheet === "fulfill"}
        onOpenChange={(o) => !o && close()}
        title={t("orders.fulfill.title")}
        description={t(digital ? "orders.fulfill.bodyDigital" : "orders.fulfill.body")}
        footer={
          <>
            <Button variant="secondary" size="lg" onClick={close} disabled={busy !== null}>{t("action.cancel")}</Button>
            <Button size="lg" onClick={fulfill} busy={busy === `${order.id}:fulfill`}>{t("orders.fulfill.confirm")}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t("orders.fulfill.note")} required hint={t("orders.fulfill.noteHint")} error={touched && note.trim().length === 0 ? t("errors.NOTE_REQUIRED") : null}>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
          </Field>
          {digital ? (
            <Field label={t("orders.fulfill.content")} required hint={t("orders.fulfill.contentHint")} error={touched && content.trim().length === 0 ? t("errors.DELIVERY_CONTENT_REQUIRED") : null}>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={8000} rows={6} />
            </Field>
          ) : null}
        </div>
      </Sheet>
    </>
  )
}
