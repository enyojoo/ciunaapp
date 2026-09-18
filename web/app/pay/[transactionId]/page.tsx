"use client"

/**
 * Hosted YooKassa Checkout.js widget page. Shared by both platforms:
 *  - Web checkout navigates here directly after creating an online-payment order.
 *  - Mobile opens this same URL in a WebView modal.
 * We never trust the widget's own `success` event alone — it only means the customer finished
 * the payment form, not that YooKassa has captured the charge. We poll our backend, which is
 * itself driven by the webhook re-fetching the authoritative payment status.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { AppPageHeader } from "@/components/layout/app-page-header"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/currency"

const WIDGET_SCRIPT_SRC = "https://yookassa.ru/checkout-widget/v1/checkout-widget.js"
const WIDGET_CONTAINER_ID = "yookassa-widget-container"
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 120000

type GatewayState = {
  transactionId: string
  status: string
  confirmationToken: string | null
  amount: number
  currency: string
}

declare global {
  interface Window {
    YooMoneyCheckoutWidget?: new (opts: Record<string, unknown>) => {
      render: (elementId: string) => void
      on: (event: string, cb: () => void) => void
      destroy?: () => void
    }
  }
}

function loadWidgetScript(): Promise<void> {
  if (window.YooMoneyCheckoutWidget) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${WIDGET_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error("widget script failed to load")))
      return
    }
    const script = document.createElement("script")
    script.src = WIDGET_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("widget script failed to load"))
    document.head.appendChild(script)
  })
}

export default function YooKassaPayPage() {
  const { t } = useTranslation("app")
  const params = useParams()
  const router = useRouter()
  const transactionId = String(params.transactionId || "").trim()

  const [gateway, setGateway] = useState<GatewayState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [widgetReady, setWidgetReady] = useState(false)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollDeadline = useRef<number>(0)

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }, [])

  const fetchGateway = useCallback(async (): Promise<GatewayState | null> => {
    try {
      const res = await fetchWithAuth(`/api/hub/checkout/gateway/${encodeURIComponent(transactionId)}`)
      if (!res.ok) return null
      const data = (await res.json()) as GatewayState
      setGateway(data)
      return data
    } catch {
      return null
    }
  }, [transactionId])

  const startPolling = useCallback(() => {
    stopPolling()
    pollDeadline.current = Date.now() + POLL_TIMEOUT_MS
    pollTimer.current = setInterval(async () => {
      const data = await fetchGateway()
      if (data && (data.status === "completed" || data.status === "processing")) {
        stopPolling()
        router.replace(`/hub/orders/${data.transactionId.toLowerCase()}`)
      } else if (data && data.status === "failed") {
        stopPolling()
      } else if (Date.now() > pollDeadline.current) {
        stopPolling()
      }
    }, POLL_INTERVAL_MS)
  }, [fetchGateway, router, stopPolling])

  useEffect(() => {
    if (!transactionId) return
    let cancelled = false
    ;(async () => {
      const data = await fetchGateway()
      if (cancelled || !data) return
      if (data.status === "completed" || data.status === "processing") {
        router.replace(`/hub/orders/${data.transactionId.toLowerCase()}`)
        return
      }
      if (!data.confirmationToken) {
        setError(t("hub.pay.missingToken", { defaultValue: "This payment link has expired." }))
        return
      }
      try {
        await loadWidgetScript()
        if (cancelled) return
        const Widget = window.YooMoneyCheckoutWidget
        if (!Widget) throw new Error("widget unavailable")
        const widget = new Widget({
          confirmation_token: data.confirmationToken,
          return_url: window.location.href,
          error_callback: () => setError(t("hub.pay.widgetError", { defaultValue: "Payment could not be started." })),
        })
        widget.render(WIDGET_CONTAINER_ID)
        widget.on("success", () => startPolling())
        widget.on("fail", () => setError(t("hub.pay.failed", { defaultValue: "Payment failed. Please try again." })))
        setWidgetReady(true)
        startPolling() // also poll in the background — the widget's success event can lag the actual capture
      } catch {
        if (!cancelled) setError(t("hub.pay.widgetError", { defaultValue: "Payment could not be started." }))
      }
    })()
    return () => {
      cancelled = true
      stopPolling()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId])

  return (
    <div className="min-w-0 space-y-0">
      <AppPageHeader title={t("hub.pay.title", { defaultValue: "Pay online" })} backHref="/transactions" />
      <div className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-md space-y-4">
          {gateway ? (
            <p className="text-center text-sm text-muted-foreground">
              {formatCurrency(gateway.amount, gateway.currency)}
            </p>
          ) : null}

          {error ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
              <Button variant="outline" onClick={() => router.back()}>
                {t("layout.back", { defaultValue: "Back" })}
              </Button>
            </div>
          ) : gateway?.status === "completed" || gateway?.status === "processing" ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <p className="text-sm text-green-800">{t("hub.pay.success", { defaultValue: "Payment received." })}</p>
            </div>
          ) : (
            <>
              {!widgetReady ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  {t("hub.pay.loading", { defaultValue: "Loading secure payment…" })}
                </div>
              ) : null}
              <div id={WIDGET_CONTAINER_ID} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
