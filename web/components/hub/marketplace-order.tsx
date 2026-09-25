"use client"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { MarketplaceOrder } from "@ciuna/shared"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { Button } from "@/components/ui/button"
import { formatCurrencySymbolOnly } from "@/utils/currency"
import { MarketplacePayStep, type MarketplacePayTab } from "./marketplace-pay-step"

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
    [payTab, setPayTab] = useState<MarketplacePayTab>("yookassa"),
    [methodId, setMethodId] = useState(""),
    [receiptFile, setReceiptFile] = useState<File | null>(null),
    errorRef = useRef<HTMLDivElement>(null),
    { t } = useTranslation("app")
  const label = (key: string) => t(`marketplace.${key}`)
  const methods = order.snapshot.methods
  const attempt = order.attempts[0]
  const methodKey = methods.map((m) => `${m.id}:${m.rail}`).join(",")

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
  useEffect(() => {
    const hasOnline = methods.some((m) => m.rail === "yookassa")
    const hasManual = methods.some((m) => m.rail === "manual")
    if (attempt?.rail === "yookassa" || (!attempt && hasOnline)) setPayTab("yookassa")
    else if (hasManual) setPayTab("manual")
    if (attempt?.rail === "manual") {
      const mid =
        methods.find((m) => m.rail === "manual" && m.id === (attempt as any).method_id)?.id ||
        methods.find((m) => m.rail === "manual")?.id ||
        ""
      setMethodId(mid)
    } else {
      setMethodId(methods.find((m) => m.rail === "yookassa")?.id || methods[0]?.id || "")
    }
  }, [methodKey, attempt?.rail, attempt?.id])

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

  async function uploadProof(file: File) {
    const a = order.attempts[0]
    if (!a) return
    setBusy(true)
    setError("")
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
      setReceiptFile(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const pay = order.nextAction === "pay" && !["failed", "superseded", "succeeded"].includes(attempt?.state || "")
  const onlinePayment =
    pay && attempt?.rail === "yookassa" && attempt.confirmation_token
      ? { transactionId: order.public_id, confirmationToken: attempt.confirmation_token }
      : null
  const activePayTab: MarketplacePayTab =
    methods.some((m) => m.rail === "yookassa")
      ? payTab === "manual"
        ? "manual"
        : "yookassa"
      : "manual"

  async function selectTab(tab: MarketplacePayTab) {
    setPayTab(tab)
    if (tab === "yookassa") {
      const online = methods.find((m) => m.rail === "yookassa")
      if (online) setMethodId(online.id)
      if (order.nextAction === "pay" && attempt?.rail !== "yookassa") {
        await action("payment-attempts", { rail: "yookassa", gatewayMode: "embedded" })
      }
      return
    }
    const manuals = methods.filter((m) => m.rail === "manual")
    const pick = manuals.find((m) => m.id === methodId) || manuals[0]
    if (pick) setMethodId(pick.id)
    if (order.nextAction === "pay" && attempt?.rail !== "manual") {
      await action("payment-attempts", {
        rail: "manual",
        paymentMethodId: pick?.id,
        gatewayMode: "embedded",
      })
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-5 p-4 pb-24">
      <h1 className="text-2xl font-semibold">{order.snapshot.title}</h1>
      <p className="text-sm text-gray-500">{order.public_id}</p>
      <p className="text-xl font-semibold">
        {label("total")}:{" "}
        {formatCurrencySymbolOnly(order.snapshot.totals.total, order.snapshot.totals.payCurrency)}
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

      {pay && methods.length > 0 && (
        <MarketplacePayStep
          methods={methods}
          payTab={activePayTab}
          onPayTab={(tab) => void selectTab(tab)}
          methodId={methodId}
          onMethodId={(id) => {
            setMethodId(id)
            void action("payment-attempts", {
              rail: "manual",
              paymentMethodId: id,
              gatewayMode: "embedded",
            })
          }}
          amount={order.snapshot.totals.total}
          currency={order.snapshot.totals.payCurrency}
          amountLabel={formatCurrencySymbolOnly(
            order.snapshot.totals.total,
            order.snapshot.totals.payCurrency,
          )}
          reference={order.public_id}
          onlinePayment={onlinePayment}
          proofSubmitted={attempt?.state === "proof_submitted"}
          receiptFile={receiptFile}
          onReceiptFile={setReceiptFile}
          busy={busy}
          canAct
          onPay={() => {
            if (attempt?.rail !== "yookassa") {
              void action("payment-attempts", { rail: "yookassa", gatewayMode: "embedded" })
            }
          }}
          onIvePaid={() => {
            if (receiptFile) void uploadProof(receiptFile)
          }}
          onWidgetCompleted={() => void load()}
          onWidgetFailed={() => void load()}
          hideOnlineCta
          onlineCreating={payTab === "yookassa" && !onlinePayment?.confirmationToken && busy}
        />
      )}

      {order.snapshot.instructions && (
        <p className="whitespace-pre-wrap text-sm text-gray-600">{order.snapshot.instructions}</p>
      )}
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
