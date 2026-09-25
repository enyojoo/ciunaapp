"use client"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMarketplaceCheckout, type PurchaseSource, type MarketplaceOrder } from "@ciuna/shared/marketplace/use-checkout"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { YooKassaCheckoutWidget } from "@/components/yookassa-checkout-widget"
import { MarketplaceOrderView } from "./marketplace-order"
const storage = {
  getItem: async (k: string) => localStorage.getItem(k),
  setItem: async (k: string, v: string) => {
    localStorage.setItem(k, v)
  },
  removeItem: async (k: string) => {
    localStorage.removeItem(k)
  },
}
export function MarketplaceCheckout({
  source,
  customAmount = false,
}: {
  source: PurchaseSource
  customAmount?: boolean
}) {
  const { userProfile } = useAuth(),
    { t } = useTranslation("app"),
    [amount, setAmount] = useState(""),
    errorRef = useRef<HTMLDivElement>(null)
  const actual =
    source.kind === "product" && customAmount ? { ...source, fundedAmount: Number(amount) } : source
  const c = useMarketplaceCheckout({
    source: actual,
    userId: userProfile?.id,
    fetcher: fetchWithAuth,
    storage,
    uuid: () => crypto.randomUUID(),
    gatewayMode: "embedded",
    initialName: [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(" "),
    initialPhone: userProfile?.phone || "",
  })
  useEffect(() => {
    if (c.error) errorRef.current?.focus()
  }, [c.error])
  const label = (key: string) => t(`marketplace.${key}`)
  if (c.order) return <><MarketplaceOrderView order={c.order} onChange={c.saveOrder}/>{source.kind==='product'&&['fulfilled','cancelled'].includes(c.order.fulfillment_state)&&<div className="mx-auto max-w-2xl p-4"><Button onClick={()=>void c.newPurchase()}>{t('marketplace.newPurchase')}</Button></div>}</>
  const q = c.quote,
    field = "block w-full rounded-xl border border-gray-200 bg-white p-3 text-base"
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 pb-24">
      <h1 className="text-2xl font-semibold">{label("checkout")}</h1>
      {c.error && (
        <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">
          {t(`marketplace.errors.${c.error}`, { defaultValue: label("retryError") })}
        </div>
      )}
      {customAmount && (
        <label className="block space-y-2">
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
      {!q && !c.error && !c.hasPending && <p role="status">{label("loading")}</p>}
      {q && (
        <>
          <section className="space-y-3 rounded-2xl bg-gray-50 p-5">
            <h2 className="font-semibold">{q.title}</h2>
            {q.lines.map((l) => (
              <div key={l.id} className="flex justify-between gap-4">
                <span>
                  {l.quantity} × {l.title}
                </span>
                <span>
                  {(l.unitPrice * l.quantity).toFixed(2)} {q.totals.productCurrency}
                </span>
              </div>
            ))}
            <p>
              {label("serviceFee")}: {q.totals.marketplaceFee.toFixed(2)} {q.totals.productCurrency}
            </p>
            {q.fulfillmentMode === "delivery" && (
              <p>
                {label("deliveryFee")}: {q.totals.deliveryFee.toFixed(2)} {q.totals.productCurrency}
              </p>
            )}
            {!!q.totals.corridorFee && (
              <p>
                {label("conversionFee")}: {q.totals.corridorFee.toFixed(2)} {q.totals.payCurrency}
              </p>
            )}
            <p className="text-xl font-semibold">
              {label("total")}: {q.totals.total.toFixed(2)} {q.totals.payCurrency}
            </p>
          </section>
          <label className="block space-y-2">
            {label("fulfillment")}
            <select
              className={field}
              value={q.fulfillmentMode}
              onChange={(e) => c.setFulfillmentMode(e.target.value as any)}
            >
              {q.modes.map((m) => (
                <option key={m} value={m}>
                  {label(m)}
                </option>
              ))}
            </select>
          </label>
          {q.instructions && <p className="whitespace-pre-wrap text-gray-600">{q.instructions}</p>}
          {q.slotStart && (
            <p>
              {new Date(q.slotStart).toLocaleString(undefined, { timeZone: q.timezone })} —{" "}
              {new Date(q.slotEnd!).toLocaleTimeString(undefined, { timeZone: q.timezone })} ({q.timezone})
            </p>
          )}
          {q.fulfillmentMode === "delivery" && (
            <>
              <label className="block space-y-2">
                {label("zone")}
                <select
                  className={field}
                  value={c.deliveryZoneId}
                  onChange={(e) => c.setDeliveryZoneId(e.target.value)}
                >
                  <option value="">{label("choose")}</option>
                  {q.zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.city} · {z.district} · {z.fee.toFixed(2)} {z.currency}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                {label("address")}
                <Input
                  autoComplete="street-address"
                  value={c.address}
                  onChange={(e) => c.setAddress(e.target.value)}
                />
              </label>
            </>
          )}
          <label className="block space-y-2">
            {label("name")}
            <Input
              autoComplete="name"
              value={c.contactName}
              onChange={(e) => c.setContactName(e.target.value)}
            />
          </label>
          <label className="block space-y-2">
            {label("phone")}
            {!q.requirePhone ? ` (${label("optional")})` : ""}
            <Input
              type="tel"
              autoComplete="tel"
              value={c.contactPhone}
              onChange={(e) => c.setContactPhone(e.target.value)}
            />
          </label>
          <p className="text-sm text-gray-600">{label("receiptEmail")}</p>
          {q.lines.map((l) =>
            l.fields.map((f) => (
              <label className="block space-y-2" key={`${l.id}:${f.key}`}>
                {l.title} · {f.label}
                {f.required ? " *" : ""}
                {f.type === "select" ? (
                  <select
                    className={field}
                    value={String(c.answers[l.id]?.[f.key] || "")}
                    onChange={(e) =>
                      c.setAnswers((a) => ({ ...a, [l.id]: { ...a[l.id], [f.key]: e.target.value } }))
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
          )}
          <label className="block space-y-2">
            {label("note")}
            <textarea className={field} value={c.note} onChange={(e) => c.setNote(e.target.value)} />
          </label>
          <details>
            <summary className="cursor-pointer py-3">{label("otherCurrency")}</summary>
            <select
              aria-label={label("otherCurrency")}
              className={field}
              value={q.totals.payCurrency}
              onChange={(e) => c.setPayCurrency(e.target.value)}
            >
              {q.payCurrencies.map((cur) => (
                <option key={cur}>{cur}</option>
              ))}
            </select>
          </details>
          <fieldset className="space-y-3">
            <legend className="mb-3 font-semibold">{label("payWith")}</legend>
            {q.methods.map((m) => (
              <label key={m.id} className="flex min-h-12 items-center gap-3 rounded-xl border p-3">
                <input
                  type="radio"
                  name="payment"
                  value={m.id}
                  checked={c.methodId === m.id}
                  onChange={() => c.setMethodId(m.id)}
                />
                {m.rail === "yookassa" ? label("online") : m.name}
              </label>
            ))}
          </fieldset>
          {!q.checkoutReady && <p role="status">{label("unavailable")}</p>}
        </>
      )}
      <Button
        className="min-h-12 w-full"
        disabled={
          c.busy ||
          (!c.hasPending &&
            (!q?.checkoutReady ||
              !c.contactName.trim() ||
              (q.requirePhone && !c.contactPhone.trim()) ||
              (q.fulfillmentMode === "delivery" && !c.address.trim())))
        }
        onClick={() => void c.submit()}
      >
        {c.busy ? label("loading") : c.hasPending ? label("resume") : label("placeOrder")}
      </Button>
    </main>
  )
}
