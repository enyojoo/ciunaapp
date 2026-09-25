"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
  useMarketplaceCheckout,
  type MarketplaceOrder,
  type PurchaseSource,
} from "@ciuna/shared/marketplace/use-checkout"
import { invalidateCheckoutWarm } from "@ciuna/shared/marketplace/checkout-warm"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { hubCartPath } from "@/lib/hub-public-paths"
import { refreshHubCartByLine } from "@/lib/hub-cart-client"
import { formatCurrencySymbolOnly } from "@/utils/currency"
import { MarketplaceOrderView } from "./marketplace-order"
import { MarketplacePayStep, type MarketplacePayTab } from "./marketplace-pay-step"
import { prefetchYooKassaWidgetScript } from "@/components/yookassa-checkout-widget"

const storage = {
  getItem: async (k: string) => localStorage.getItem(k),
  setItem: async (k: string, v: string) => {
    localStorage.setItem(k, v)
  },
  removeItem: async (k: string) => {
    localStorage.removeItem(k)
  },
}

function isOpenPay(order: MarketplaceOrder) {
  return order.nextAction === "pay" || order.nextAction === "checking"
}

export function MarketplaceCheckout({
  source,
  customAmount = false,
  seed,
}: {
  source: PurchaseSource
  customAmount?: boolean
  seed?: {
    title: string
    lines: { id: string; quantity: number; title: string; unitPrice: number }[]
    currency: string
    total?: number
  }
}) {
  const { userProfile } = useAuth(),
    { t } = useTranslation("app"),
    router = useRouter(),
    [amount, setAmount] = useState(""),
    [payTab, setPayTab] = useState<MarketplacePayTab>("yookassa"),
    [receiptFile, setReceiptFile] = useState<File | null>(null),
    [leaving, setLeaving] = useState(false),
    errorRef = useRef<HTMLDivElement>(null)
  const autoOnline = useRef(false)
  const actual =
    source.kind === "product" && customAmount ? { ...source, fundedAmount: Number(amount) } : source
  const c = useMarketplaceCheckout({
    source: actual,
    userId: userProfile?.id,
    fetcher: fetchWithAuth,
    storage,
    uuid: () => crypto.randomUUID(),
    gatewayMode: "embedded",
    initialName:
      [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(" ") ||
      userProfile?.email?.split("@")[0] ||
      "",
    initialPhone: userProfile?.phone || "",
  })

  const label = (key: string) => t(`marketplace.${key}`)
  const paying = !!(c.order && isOpenPay(c.order)) || leaving
  const doneOrder = !leaving && !!(c.order && !isOpenPay(c.order))
  const q = c.quote
  const snap = c.order?.snapshot
  const methods = snap?.methods || q?.methods || []
  const methodKey = methods.map((m) => `${m.id}:${m.rail}`).join(",")
  const attempt = c.order?.attempts[0]

  useEffect(() => {
    prefetchYooKassaWidgetScript()
  }, [])

  useEffect(() => {
    if (c.error) errorRef.current?.focus()
  }, [c.error])

  useEffect(() => {
    if (!methods.length) return
    const hasOnline = methods.some((m) => m.rail === "yookassa")
    const hasManual = methods.some((m) => m.rail === "manual")
    if (attempt?.rail === "yookassa" || (!attempt && hasOnline)) setPayTab("yookassa")
    else if (hasManual) setPayTab("manual")
    else if (hasOnline) setPayTab("yookassa")
  }, [methodKey, attempt?.rail, attempt?.id])

  useEffect(() => {
    autoOnline.current = false
  }, [q?.id])

  useEffect(() => {
    if (doneOrder || paying || !q || payTab !== "yookassa") return
    if (!q.methods.some((m) => m.rail === "yookassa")) return
    const ready =
      !!paying ||
      (!!q.checkoutReady &&
        !!c.contactName.trim() &&
        (!q.requirePhone || !!c.contactPhone.trim()) &&
        (q.fulfillmentMode !== "delivery" || (!!c.deliveryZoneId && !!c.address.trim())))
    if (!ready || c.busy || !c.contactName.trim()) return
    if (attempt?.rail === "yookassa" && attempt.confirmation_token) return
    if (autoOnline.current) return
    autoOnline.current = true
    void (async () => {
      if (c.order && c.order.nextAction === "pay") {
        if (attempt?.rail !== "yookassa") {
          await c.action("payment-attempts", { rail: "yookassa", gatewayMode: "embedded" })
        }
        return
      }
      const online = q.methods.find((m) => m.rail === "yookassa")
      const order = await c.submit(online ? { methodId: online.id } : undefined)
      const token = order?.attempts?.[0]?.confirmation_token
      if (!order || !token) autoOnline.current = false
    })()
  }, [
    q?.id,
    q?.checkoutReady,
    q?.requirePhone,
    q?.fulfillmentMode,
    payTab,
    paying,
    doneOrder,
    c.busy,
    c.contactName,
    c.contactPhone,
    c.deliveryZoneId,
    c.address,
    attempt?.rail,
    attempt?.confirmation_token,
  ])

  const seedTotals = seed
    ? {
        productCurrency: seed.currency,
        payCurrency: seed.currency,
        marketplaceFee: 0,
        deliveryFee: 0,
        corridorFee: 0,
        total:
          seed.total ??
          seed.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
      }
    : null
  const totals = snap?.totals || q?.totals || seedTotals
  const fulfillmentMode = snap?.fulfillmentMode || q?.fulfillmentMode
  const modes = snap?.modes || q?.modes || []
  const title = snap?.title || q?.title || seed?.title || ""
  const lines = snap?.lines || q?.lines || seed?.lines || []
  const onlinePayment =
    attempt?.rail === "yookassa" && attempt.confirmation_token
      ? { transactionId: c.order!.public_id, confirmationToken: attempt.confirmation_token }
      : null

  const field =
    "block w-full rounded-xl border border-[#E8E4DC] bg-white p-3 text-base text-gray-900"
  const destHeading =
    fulfillmentMode === "delivery"
      ? label("deliveryDetails")
      : fulfillmentMode === "pickup"
        ? label("pickupDetails")
        : label("contactDetails")
  const canAct =
    !!paying ||
    (!!q?.checkoutReady &&
      !!c.contactName.trim() &&
      (!q.requirePhone || !!c.contactPhone.trim()) &&
      (q.fulfillmentMode !== "delivery" || (!!c.deliveryZoneId && !!c.address.trim())))

  const activePayTab: MarketplacePayTab =
    methods.some((m) => m.rail === "yookassa")
      ? payTab === "manual"
        ? "manual"
        : "yookassa"
      : "manual"

  const moneyLabel = totals ? formatCurrencySymbolOnly(totals.total, totals.payCurrency) : ""
  const onlineCreating =
    activePayTab === "yookassa" &&
    !onlinePayment?.confirmationToken &&
    !!(
      canAct ||
      c.busy ||
      autoOnline.current ||
      !!seed ||
      !q ||
      (!!q.checkoutReady && !!c.contactName.trim())
    )
  /** Placeholder so pay frame paints immediately from cart before quote returns. */
  const payMethods =
    methods.length > 0
      ? methods
      : seed
        ? [
            {
              id: "_pending_online",
              rail: "yookassa" as const,
              name: "Pay online",
              currency: seed.currency,
              instructions: {},
            },
          ]
        : []

  if (doneOrder)
    return (
      <>
        <MarketplaceOrderView order={c.order!} onChange={c.saveOrder} />
        {["fulfilled", "cancelled"].includes(c.order!.fulfillment_state) && source.kind !== "cart" ? (
          <div className="mx-auto max-w-2xl p-4">
            <Button onClick={() => void c.newPurchase()}>{t("marketplace.newPurchase")}</Button>
          </div>
        ) : null}
      </>
    )

  async function selectTab(tab: MarketplacePayTab) {
    setPayTab(tab)
    if (tab === "yookassa") {
      const online = methods.find((m) => m.rail === "yookassa")
      if (online) c.setMethodId(online.id)
      if (c.order && c.order.nextAction === "pay" && attempt?.rail !== "yookassa") {
        await c.action("payment-attempts", { rail: "yookassa", gatewayMode: "embedded" })
      }
      return
    }
    const manuals = methods.filter((m) => m.rail === "manual")
    const pick = manuals.find((m) => m.id === c.methodId) || manuals[0]
    if (pick) c.setMethodId(pick.id)
    if (c.order && c.order.nextAction === "pay" && attempt?.rail !== "manual") {
      await c.action("payment-attempts", {
        rail: "manual",
        paymentMethodId: pick?.id,
        gatewayMode: "embedded",
      })
    }
  }

  async function selectManualMethod(id: string) {
    c.setMethodId(id)
    if (c.order && c.order.nextAction === "pay") {
      await c.action("payment-attempts", {
        rail: "manual",
        paymentMethodId: id,
        gatewayMode: "embedded",
      })
    }
  }

  async function handlePay() {
    if (c.order && c.order.nextAction === "pay") {
      if (attempt?.rail !== "yookassa") {
        await c.action("payment-attempts", { rail: "yookassa", gatewayMode: "embedded" })
      }
      return
    }
    const online = methods.find((m) => m.rail === "yookassa")
    await c.submit(online ? { methodId: online.id } : undefined)
  }

  async function handleIvePaid() {
    if (!receiptFile) return
    let order = c.order
    if (!order) {
      const manuals = methods.filter((m) => m.rail === "manual")
      const pick = manuals.find((m) => m.id === c.methodId) || manuals[0]
      order = (await c.submit(pick ? { methodId: pick.id } : undefined)) || null
    } else if (order.nextAction === "pay" && attempt?.rail !== "manual") {
      const pick = methods.find((m) => m.id === c.methodId && m.rail === "manual")
      await c.action("payment-attempts", {
        rail: "manual",
        paymentMethodId: pick?.id || c.methodId,
        gatewayMode: "embedded",
      })
      order = c.order || order
    }
    if (!order) return
    await c.uploadProof(
      { blob: receiptFile, name: receiptFile.name, type: receiptFile.type },
      { order },
    )
    setReceiptFile(null)
  }

  return (
    <main className="mx-auto max-w-2xl space-y-5 bg-[oklch(0.99_0_0)] p-4 pb-24">
      {c.error && (
        <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800">
          {t(`marketplace.errors.${c.error}`, { defaultValue: label("retryError") })}
        </div>
      )}
      {customAmount && !paying && (
        <label className="block space-y-2 text-sm font-semibold text-gray-900">
          {label("amount")}
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
      )}
      {!q && !c.order && !c.error && !seed ? (
        <div role="status" className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : null}
      {(q || snap || seed) && totals && (
        <>
          <section className="space-y-3 rounded-2xl border border-[#E8E4DC] bg-white p-5">
            <h2 className="text-base font-semibold tracking-tight text-gray-900">{title}</h2>
            {c.order?.public_id ? (
              <p className="text-sm text-gray-500">{c.order.public_id}</p>
            ) : null}
            <div className="space-y-2">
              {lines.map((l) => (
                <div key={l.id} className="flex justify-between gap-4 text-[15px] text-gray-900">
                  <span className="min-w-0">
                    {l.quantity} × {l.title}
                  </span>
                  <span className="shrink-0 tabular-nums font-medium">
                    {formatCurrencySymbolOnly(l.unitPrice * l.quantity, totals.productCurrency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-[#E8E4DC] pt-3 text-sm text-gray-500">
              <div className="flex justify-between gap-4">
                <span>{label("serviceFee")}</span>
                <span className="tabular-nums">
                  {formatCurrencySymbolOnly(totals.marketplaceFee, totals.productCurrency)}
                </span>
              </div>
              {fulfillmentMode === "delivery" && (
                <div className="flex justify-between gap-4">
                  <span>{label("deliveryFee")}</span>
                  <span className="tabular-nums">
                    {formatCurrencySymbolOnly(totals.deliveryFee, totals.productCurrency)}
                  </span>
                </div>
              )}
              {!!totals.corridorFee && (
                <div className="flex justify-between gap-4">
                  <span>{label("conversionFee")}</span>
                  <span className="tabular-nums">
                    {formatCurrencySymbolOnly(totals.corridorFee, totals.payCurrency)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-4 pt-1">
              <span className="text-base font-semibold text-gray-900">{label("total")}</span>
              <span className="text-2xl font-semibold tracking-tight text-gray-900 tabular-nums">
                {formatCurrencySymbolOnly(totals.total, totals.payCurrency)}
              </span>
            </div>
            {paying && c.order ? (
              <div className="text-sm text-gray-500" aria-live="polite">
                <p>
                  {label("payment")}: {label(c.order.payment_state)}
                </p>
              </div>
            ) : null}
          </section>

          {!paying && (q || seed) && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold tracking-tight text-gray-900">{destHeading}</h2>
              <div className="space-y-4 rounded-2xl border border-[#E8E4DC] bg-white p-5">
              {q && modes.length > 1 && (
                <label className="block space-y-2 text-sm font-semibold text-gray-900">
                  {label("fulfillment")}
                  <select
                    className={field}
                    value={q.fulfillmentMode}
                    onChange={(e) => c.setFulfillmentMode(e.target.value as any)}
                  >
                    {modes.map((m) => (
                      <option key={m} value={m}>
                        {label(m)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {q?.slotStart && (
                <p className="text-sm text-gray-500">
                  {new Date(q.slotStart).toLocaleString(undefined, { timeZone: q.timezone })} —{" "}
                  {new Date(q.slotEnd!).toLocaleTimeString(undefined, { timeZone: q.timezone })} (
                  {q.timezone})
                </p>
              )}
              {q?.fulfillmentMode === "pickup" && (
                <div className="space-y-3 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] p-4 text-sm text-gray-700">
                  {q.pickupLocation ? (
                    <div>
                      <p className="font-semibold text-gray-900">{label("pickupLocation")}</p>
                      <p className="whitespace-pre-wrap">{q.pickupLocation}</p>
                    </div>
                  ) : null}
                  {q.pickupHours ? (
                    <div>
                      <p className="font-semibold text-gray-900">{label("pickupHours")}</p>
                      <p className="whitespace-pre-wrap">{q.pickupHours}</p>
                    </div>
                  ) : null}
                  {q.fulfillmentNotes ? (
                    <div>
                      <p className="font-semibold text-gray-900">{label("fulfillmentNotes")}</p>
                      <p className="whitespace-pre-wrap">{q.fulfillmentNotes}</p>
                    </div>
                  ) : null}
                  {!q.pickupLocation && !q.pickupHours && q.instructions ? (
                    <p className="whitespace-pre-wrap">{q.instructions}</p>
                  ) : null}
                </div>
              )}
              {q?.fulfillmentMode === "delivery" && (
                <>
                  <label className="block space-y-2 text-sm font-semibold text-gray-900">
                    {label("zone")}
                    <select
                      className={field}
                      value={c.deliveryZoneId}
                      onChange={(e) => c.setDeliveryZoneId(e.target.value)}
                    >
                      <option value="">{label("chooseZone")}</option>
                      {q.zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.city} · {z.district} · {formatCurrencySymbolOnly(z.fee, z.currency)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!c.deliveryZoneId && q.zones.length === 0 && (
                    <p role="status" className="text-sm text-amber-800">
                      {label("noZones")}
                    </p>
                  )}
                  <label className="block space-y-2 text-sm font-semibold text-gray-900">
                    {label("address")}
                    <Input
                      autoComplete="street-address"
                      value={c.address}
                      onChange={(e) => c.setAddress(e.target.value)}
                    />
                  </label>
                </>
              )}
              {(q?.fulfillmentMode === "digital" || (!q && seed)) && (
                <p className="text-sm text-gray-500">{label("digitalAccessNote")}</p>
              )}
              {q
                ? q.lines.map((l) =>
                    l.fields.map((f) => (
                      <label className="block space-y-2 text-sm font-semibold text-gray-900" key={`${l.id}:${f.key}`}>
                        {l.title} · {f.label}
                        {f.required ? " *" : ""}
                        {f.type === "select" ? (
                          <select
                            className={field}
                            value={String(c.answers[l.id]?.[f.key] || "")}
                            onChange={(e) =>
                              c.setAnswers((a) => ({
                                ...a,
                                [l.id]: { ...a[l.id], [f.key]: e.target.value },
                              }))
                            }
                          >
                            <option value="">{label("choose")}</option>
                            {f.options?.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            type={f.type === "number" ? "number" : f.type === "url" ? "url" : "text"}
                            value={String(c.answers[l.id]?.[f.key] ?? "")}
                            onChange={(e) =>
                              c.setAnswers((a) => ({
                                ...a,
                                [l.id]: {
                                  ...a[l.id],
                                  [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                                },
                              }))
                            }
                          />
                        )}
                      </label>
                    )),
                  )
                : null}
              <label className="block space-y-2 text-sm font-semibold text-gray-900">
                {label("note")}
                <textarea className={field} value={c.note} onChange={(e) => c.setNote(e.target.value)} />
              </label>
              {q && !q.checkoutReady && (
                <p role="status" className="text-sm text-amber-800">
                  {label("unavailable")}
                </p>
              )}
              </div>
            </section>
          )}

          {payMethods.length > 0 && (
            <MarketplacePayStep
              methods={payMethods}
              payTab={activePayTab}
              onPayTab={(tab) => void selectTab(tab)}
              methodId={c.methodId}
              onMethodId={(id) => void selectManualMethod(id)}
              amount={totals.total}
              currency={totals.payCurrency}
              amountLabel={moneyLabel}
              reference={c.order?.public_id}
              onlinePayment={onlinePayment}
              proofSubmitted={attempt?.state === "proof_submitted"}
              receiptFile={receiptFile}
              onReceiptFile={setReceiptFile}
              busy={c.busy}
              canAct={canAct}
              onPay={() => void handlePay()}
              onIvePaid={() => void handleIvePaid()}
              onWidgetCompleted={() => void c.refresh()}
              onWidgetFailed={() => void c.refresh()}
              hideOnlineCta
              onlineCreating={onlineCreating}
            />
          )}

          {(paying || leaving) && (c.order?.canCancel || leaving) ? (
            <Button
              variant="outline"
              disabled={c.busy || leaving}
              onClick={() => {
                void (async () => {
                  const slug = (c.order?.line || "mart") as "food" | "mart"
                  if (source.kind === "cart") setLeaving(true)
                  const result = await c.action("cancel", {})
                  if (!result?.order) {
                    setLeaving(false)
                    return
                  }
                  if (source.kind !== "cart") return
                  invalidateCheckoutWarm(source.cartId)
                  toast(label("orderCancelled"))
                  await refreshHubCartByLine(slug)
                  await c.newPurchase()
                  router.replace(hubCartPath(slug))
                })()
              }}
            >
              {c.busy || leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : label("cancel")}
            </Button>
          ) : null}
        </>
      )}
    </main>
  )
}
