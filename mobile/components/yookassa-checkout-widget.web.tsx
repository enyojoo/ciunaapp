/**
 * Expo web: YooKassa Checkout.js + gateway poll (same UX as Next.js web inline widget).
 */

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { fetchWithAuth } from "@/lib/api"
import { OnlinePaySkeleton } from "@/components/online-pay-skeleton"
import { colors, type as typeSize } from "@/lib/theme"

const WIDGET_SCRIPT_SRC = "https://yookassa.ru/checkout-widget/v1/checkout-widget.js"
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
  onCompleted,
  onFailed,
}: {
  transactionId: string
  confirmationToken?: string | null
  onCompleted?: (transactionId: string) => void
  onFailed?: (message: string) => void
}) {
  const { t } = useTranslation("app")
  const reactId = useId().replace(/:/g, "")
  const containerId = `yookassa-widget-${reactId}`
  const hostRef = useRef<HTMLDivElement | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [widgetReady, setWidgetReady] = useState(false)
  const [done, setDone] = useState(false)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollDeadline = useRef(0)
  const widgetRef = useRef<{ destroy?: () => void } | null>(null)
  const completedRef = useRef(false)

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
      return (await res.json()) as GatewayState
    } catch {
      return null
    }
  }, [transactionId])

  const finishCompleted = useCallback(
    (id: string) => {
      if (completedRef.current) return
      completedRef.current = true
      stopPolling()
      setDone(true)
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
    if (!transactionId || typeof document === "undefined") return
    let cancelled = false
    completedRef.current = false

    ;(async () => {
      try {
        const [gateway] = await Promise.all([
          fetchGateway().catch(() => null),
          loadWidgetScript(),
        ])
        if (cancelled) return
        if (gateway && (gateway.status === "completed" || gateway.status === "processing")) {
          finishCompleted(gateway.transactionId)
          return
        }
        const token = initialToken || gateway?.confirmationToken || null
        if (!token) {
          const msg = t("hub.pay.missingToken", { defaultValue: "This payment link has expired." })
          setError(msg)
          onFailed?.(msg)
          return
        }
        const host = hostRef.current
        if (!host) throw new Error("no host")
        host.innerHTML = ""
        const mount = document.createElement("div")
        mount.id = containerId
        mount.style.width = "100%"
        mount.style.maxWidth = "100%"
        mount.style.minWidth = "0"
        mount.style.boxSizing = "border-box"
        mount.style.overflow = "hidden"
        host.appendChild(mount)

        // Keep Checkout.js iframes / roots inside the pay card on narrow phones.
        const styleId = `${containerId}-fit`
        if (!document.getElementById(styleId)) {
          const style = document.createElement("style")
          style.id = styleId
          style.textContent = `
            #${containerId}, #${containerId} * { max-width: 100% !important; box-sizing: border-box; }
            #${containerId} iframe { width: 100% !important; max-width: 100% !important; }
          `
          document.head.appendChild(style)
        }

        const Widget = window.YooMoneyCheckoutWidget
        if (!Widget) throw new Error("widget unavailable")
        const widget = new Widget({
          confirmation_token: token,
          return_url: typeof window !== "undefined" ? window.location.href : "",
          customization: {
            colors: {
              background: "#FFFFFF",
              control_primary: "#F97316",
            },
          },
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
      if (hostRef.current) hostRef.current.innerHTML = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId, initialToken])

  if (error) {
    return (
      <View style={styles.boxError}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  if (done) {
    return (
      <View style={styles.boxOk}>
        <Text style={styles.okText}>{t("hub.pay.success", { defaultValue: "Payment received." })}</Text>
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      {!widgetReady ? (
        <View style={styles.skeletonLayer}>
          <OnlinePaySkeleton
            caption={t("hub.pay.loading", { defaultValue: "Loading secure payment…" })}
          />
        </View>
      ) : null}
      <View ref={hostRef as never} style={styles.host} collapsable={false} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    minHeight: 320,
    position: "relative",
    alignSelf: "stretch",
    overflow: "hidden",
  },
  skeletonLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1,
    backgroundColor: colors.surface,
  },
  host: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    minHeight: 280,
    alignSelf: "stretch",
    overflow: "hidden",
  },
  boxError: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  errorText: { fontSize: typeSize.meta, color: "#B91C1C", textAlign: "center" },
  boxOk: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  okText: { fontSize: typeSize.meta, color: "#166534", textAlign: "center" },
})
