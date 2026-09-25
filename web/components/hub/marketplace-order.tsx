"use client"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { MarketplaceOrder } from "@ciuna/shared"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { Button } from "@/components/ui/button"
import { YooKassaCheckoutWidget } from "@/components/yookassa-checkout-widget"
export function MarketplaceOrderView({
  order: initial,
  onChange,
}: {
  order: MarketplaceOrder
  onChange?: (o: MarketplaceOrder) => unknown
}) {
  const [order, setOrder] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    errorRef = useRef<HTMLDivElement>(null),
    { t } = useTranslation("app")
  const label = (key: string) => t(`marketplace.${key}`)
  async function load() {
    const r = await fetchWithAuth(`/api/hub/orders/${initial.id}`)
    if (r.ok) {
      const d = await r.json()
      setOrder(d.order)
      onChange?.(d.order)
    }
  }
  useEffect(() => {
    setOrder(initial)
  }, [initial])
  useEffect(() => {
    const id = setInterval(() => void load(), 5000)
    return () => clearInterval(id)
  }, [initial.id])
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])
  async function action(path: string, body: unknown = {}) {
    setBusy(true)
    setError("")
    try {
      const r = await fetchWithAuth(`/api/hub/orders/${order.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) throw Error(d.errorCode || d.error)
      await load()
      return d
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function upload(file: File) {
    const a = order.attempts[0]
    if (!a) return
    setBusy(true)
    try {
      if (file.size > 10 * 1024 * 1024) throw Error("INVALID_PROOF")
      const init = await action("payment-proof", {
        attemptId: a.id,
        extension: file.name.split(".").pop()?.toLowerCase(),
      })
      if (!init) return
      const response = await fetch(init.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!response.ok) throw Error("UPLOAD_FAILED")
      await action("payment-proof", { attemptId: a.id, path: init.path })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const a = order.attempts[0],
    pay = order.nextAction === "pay" && !["failed", "superseded", "succeeded"].includes(a?.state || "")
  return (
    <main className="mx-auto max-w-2xl space-y-5 p-4 pb-24">
      <h1 className="text-2xl font-semibold">{order.snapshot.title}</h1>
      <p className="text-sm text-gray-500">{order.public_id}</p>
      <p className="text-xl font-semibold">
        {label("total")}: {order.snapshot.totals.total.toFixed(2)} {order.snapshot.totals.payCurrency}
      </p>
      <div className="rounded-xl bg-gray-50 p-4" aria-live="polite">
        <p>
          {label("payment")}: {label(order.payment_state)}
        </p>
        <p>
          {label("fulfillment")}: {label(order.fulfillment_state)}
        </p>
      </div>
      {error && (
        <div ref={errorRef} tabIndex={-1} role="alert">
          {t(`marketplace.errors.${error}`, { defaultValue: label("retryError") })}
        </div>
      )}
      {order.exception_reason && <p role="status">{label("review")}</p>}
      {["pay", "checking"].includes(order.nextAction) && (
        <p>
          {label("deadline")}: {new Date(order.payment_deadline).toLocaleString()}
        </p>
      )}
      {pay && a?.rail === "yookassa" && a.confirmation_token && (
        <YooKassaCheckoutWidget
          transactionId={order.public_id}
          confirmationToken={a.confirmation_token}
          onCompleted={() => void load()}
          onFailed={() => void load()}
        />
      )}
      {pay && a?.rail === "yookassa" && a.confirmation_mode === "native" && (
        <a className="block underline" href={`ciuna://orders/${order.public_id}`}>
          {label("resumeNative")}
        </a>
      )}
      {pay && a?.rail === "manual" && (
        <section className="space-y-3">
          <h2 className="font-semibold">{label("instructions")}</h2>
          {Object.entries(a.instructions)
            .filter(([k]) => !["type", "name"].includes(k))
            .map(([k, v]) => (
              <p key={k} className="break-words whitespace-pre-wrap">
                <span className="font-medium">
                  {t(`marketplace.instructionsLabels.${k}`, { defaultValue: k.replaceAll("_", " ") })}:{" "}
                </span>
                {String(v)}
              </p>
            ))}
          <p>
            {label("reference")}: {order.public_id}
          </p>
          <label className="block">
            {label("proof")}
            <input
              className="block py-3"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              disabled={busy}
              onChange={(e) => {
                if (e.target.files?.[0]) void upload(e.target.files[0])
              }}
            />
          </label>
          {a.state === "proof_submitted" && <p>{label("proof_submitted")}</p>}
        </section>
      )}
      {order.nextAction === "pay" &&
        order.snapshot.methods.map((m) => (
          <Button
            key={m.id}
            variant="outline"
            disabled={busy}
            onClick={() =>
              void action("payment-attempts", {
                rail: m.rail,
                paymentMethodId: m.rail === "manual" ? m.id : undefined,
                gatewayMode: "embedded",
              })
            }
          >
            {label("payWith")} {m.rail === "yookassa" ? label("online") : m.name}
          </Button>
        ))}
      {order.snapshot.instructions && <p className="whitespace-pre-wrap">{order.snapshot.instructions}</p>}
      {order.digital_content && (
        <section className="rounded-xl border p-4">
          <h2 className="font-semibold">{label("digitalDelivery")}</h2>
          <p className="whitespace-pre-wrap break-words">{order.digital_content}</p>
        </section>
      )}
      <ol className="space-y-3">
        {order.events.map((e) => (
          <li key={e.id}>
            <p>{t(`marketplace.events.${e.kind}`, { defaultValue: label("updated") })}</p>
            <time className="text-sm text-gray-500">{new Date(e.created_at).toLocaleString()}</time>
          </li>
        ))}
      </ol>
      {order.canCancel && (
        <Button variant="outline" disabled={busy} onClick={() => void action("cancel")}>
          {label("cancel")}
        </Button>
      )}
      <a
        className="block underline"
        href={`mailto:support@ciuna.com?subject=${encodeURIComponent(order.public_id)}`}
      >
        {label("support")}
      </a>
    </main>
  )
}
