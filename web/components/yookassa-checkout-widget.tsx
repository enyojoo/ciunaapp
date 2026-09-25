"use client"

/**
 * YooKassa Checkout.js widget + status poll.
 * Used inline on Hub/Experts checkout pay step, and on `/pay/[id]` for deep-link/resume.
 * Never trust the widget `success` event alone — poll `/api/hub/checkout/gateway/:id`
 * (webhook-backed) until completed/processing/failed.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle2, XCircle } from "lucide-react"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { Button } from "@/components/ui/button"
import { OnlinePaySkeleton } from "@/components/hub/online-pay-skeleton"
import { formatCurrency } from "@/utils/currency"

const WIDGET_SCRIPT_SRC = "https://yookassa.ru/checkout-widget/v1/checkout-widget.js"
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 120000

export type YooKassaGatewayState = {
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
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
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

/** Warm the Checkout.js script before the confirmation token is ready. */
export function prefetchYooKassaWidgetScript() {
  if (typeof window === "undefined") return
  void loadWidgetScript().catch(() => {})
}

export function YooKassaCheckoutWidget({
  transactionId,
  confirmationToken: initialToken,
  amount,
  currency,
  returnUrl,
  onCompleted,
  onFailed,
  showAmount = true,
}: {
  transactionId: string
  confirmationToken?: string | null
  amount?: number | null
  currency?: string | null
  /** Defaults to current page URL (required by Checkout.js). */
  returnUrl?: string
  onCompleted?: (transactionId: string) => void
  onFailed?: (message: string) => void
  showAmount?: boolean
}) {
  const { t } = useTranslation("app")
  const reactId = useId().replace(/:/g, "")
  const containerId = `yookassa-widget-${reactId}`

  const [gateway, setGateway] = useState<YooKassaGatewayState | null>(
    initialToken || amount != null
      ? {
          transactionId,
          status: "pending",
          confirmationToken: initialToken ?? null,
          amount: amount ?? 0,
          currency: currency || "RUB",
        }
      : null,
  )
  const [error, setError] = useState<string | null>(null)
  const [widgetReady, setWidgetReady] = useState(false)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollDeadline = useRef<number>(0)
  const widgetRef = useRef<{ destroy?: () => void } | null>(null)
  const completedRef = useRef(false)

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }, [])

  const fetchGateway = useCallback(async (): Promise<YooKassaGatewayState | null> => {
    try {
      const res = await fetchWithAuth(`/api/hub/checkout/gateway/${encodeURIComponent(transactionId)}`)
      if (!res.ok) return null
      const data = (await res.json()) as YooKassaGatewayState
      setGateway(data)
      return data
    } catch {
      return null
    }
  }, [transactionId])

  const finishCompleted = useCallback(
    (id: string) => {
      if (completedRef.current) return
      completedRef.current = true
      stopPolling()
      onCompleted?.(id)
    },
    [onCompleted, stopPolling],
  )

  const startPolling = useCallback(() => {
    stopPolling()
    pollDeadline.current = Date.now() + POLL_TIMEOUT_MS
    pollTimer.current = setInterval(async () => {
      const data = await fetchGateway()
      if (data && (data.status === "completed" || data.status === "processing")) {
        finishCompleted(data.transactionId)
      } else if (data && data.status === "failed") {
        stopPolling()
        const msg = t("hub.pay.failed", { defaultValue: "Payment failed. Please try again." })
        setError(msg)
        onFailed?.(msg)
      } else if (Date.now() > pollDeadline.current) {
        stopPolling()
      }
    }, POLL_INTERVAL_MS)
  }, [fetchGateway, finishCompleted, onFailed, stopPolling, t])

  useEffect(() => {
    if (!transactionId) return
    let cancelled = false
    completedRef.current = false

    ;(async () => {
      try {
        const tokenHint = initialToken || gateway?.confirmationToken || null
        const [data] = await Promise.all([
          tokenHint && gateway?.confirmationToken
            ? Promise.resolve(gateway)
            : fetchGateway().catch(() => gateway),
          loadWidgetScript(),
        ])
        if (cancelled) return
        if (!data && !tokenHint) {
          const msg = t("hub.pay.widgetError", { defaultValue: "Payment could not be started." })
          setError(msg)
          onFailed?.(msg)
          return
        }
        if (data && (data.status === "completed" || data.status === "processing")) {
          finishCompleted(data.transactionId)
          return
        }
        const token = tokenHint || data?.confirmationToken || null
        if (!token) {
          const msg = t("hub.pay.missingToken", { defaultValue: "This payment link has expired." })
          setError(msg)
          onFailed?.(msg)
          return
        }
        const Widget = window.YooMoneyCheckoutWidget
        if (!Widget) throw new Error("widget unavailable")
        const widget = new Widget({
          confirmation_token: token,
          return_url: returnUrl || (typeof window !== "undefined" ? window.location.href : ""),
          error_callback: () => {
            const msg = t("hub.pay.widgetError", { defaultValue: "Payment could not be started." })
            setError(msg)
            onFailed?.(msg)
          },
        })
        widgetRef.current = widget
        widget.render(containerId)
        widget.on("success", () => startPolling())
        widget.on("fail", () => {
          const msg = t("hub.pay.failed", { defaultValue: "Payment failed. Please try again." })
          setError(msg)
          onFailed?.(msg)
        })
        setWidgetReady(true)
        startPolling()
      } catch {
        if (!cancelled) {
          const msg = t("hub.pay.widgetError", { defaultValue: "Payment could not be started." })
          setError(msg)
          onFailed?.(msg)
        }
      }
    })()

    return () => {
      cancelled = true
      stopPolling()
      try {
        widgetRef.current?.destroy?.()
      } catch {
        // ignore
      }
      widgetRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId, initialToken])

  const displayAmount = gateway?.amount ?? amount
  const displayCurrency = gateway?.currency ?? currency

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <XCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )
  }

  if (gateway?.status === "completed" || gateway?.status === "processing") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
        <p className="text-sm text-green-800">{t("hub.pay.success", { defaultValue: "Payment received." })}</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-[320px] space-y-4">
      {showAmount && displayAmount != null && displayCurrency ? (
        <p className="text-center text-sm text-muted-foreground">{formatCurrency(Number(displayAmount), String(displayCurrency))}</p>
      ) : null}
      {!widgetReady ? (
        <div className="absolute inset-x-0 top-0 z-10 bg-white">
          <OnlinePaySkeleton
            caption={t("hub.pay.loading", { defaultValue: "Loading secure payment…" })}
          />
        </div>
      ) : null}
      <div id={containerId} className="min-h-[280px]" />
    </div>
  )
}

/** Optional dismiss control when embedded with a parent error handler. */
export function YooKassaPayErrorActions({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation("app")
  return (
    <Button variant="outline" onClick={onBack} className="mt-3">
      {t("layout.back", { defaultValue: "Back" })}
    </Button>
  )
}
