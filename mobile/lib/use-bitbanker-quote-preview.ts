import { useEffect, useRef, useState } from "react"
import { minSendAmountForCurrency } from "@ciuna/shared"
import {
  noticeForQuotePreviewFailure,
  noticeForQuotePreviewNetworkFailure,
  type SendQuotePreviewNotice,
} from "./bitbanker-quote-notice"
import { fetchWithAuth } from "./api"

export type BitbankerQuotePreview = {
  sendAmount: number
  receiveAmount: number
  exchangeRate: number
  feeAmount: number
  feeType: string
  paymentProcessingFee: number
  totalAmount: number
}

export function useBitbankerQuotePreview(opts: {
  enabled: boolean
  sendAmount: string
  sendCurrency: string
  receiveCurrency: string
}) {
  const [preview, setPreview] = useState<BitbankerQuotePreview | null>(null)
  const [notice, setNotice] = useState<SendQuotePreviewNotice | null>(null)
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    if (!opts.enabled) {
      setPreview(null)
      setNotice(null)
      setLoading(false)
      return
    }

    const amount = Number(opts.sendAmount)
    const min = minSendAmountForCurrency(opts.sendCurrency)
    if (!Number.isFinite(amount) || amount <= 0 || (min != null && amount < min)) {
      setPreview(null)
      setNotice(null)
      setLoading(false)
      return
    }

    const id = ++requestId.current
    setLoading(true)
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetchWithAuth("/api/send/quotes/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sendAmount: amount,
              sendCurrency: opts.sendCurrency,
              receiveCurrency: opts.receiveCurrency,
            }),
          })
          const body = (await res.json().catch(() => ({}))) as {
            error?: string
            errorCode?: string
            preview?: BitbankerQuotePreview
          }
          if (requestId.current !== id) return
          if (!res.ok) {
            if (__DEV__) {
              console.warn("[quote-preview]", res.status, body.error ?? res.statusText)
            }
            setPreview(null)
            setNotice(noticeForQuotePreviewFailure(res.status, body.error, body.errorCode))
            return
          }
          const p = body.preview
          if (!p) {
            setPreview(null)
            setNotice(noticeForQuotePreviewFailure(400, "Invalid preview response"))
            return
          }
          setPreview(p)
          setNotice(null)
        } catch {
          if (requestId.current !== id) return
          setPreview(null)
          setNotice(noticeForQuotePreviewNetworkFailure())
        } finally {
          if (requestId.current === id) setLoading(false)
        }
      })()
    }, 280)

    return () => {
      clearTimeout(timer)
      if (requestId.current === id) setLoading(false)
    }
  }, [opts.enabled, opts.sendAmount, opts.sendCurrency, opts.receiveCurrency])

  const hasFreshPreview = Boolean(preview)
  const feesConfirmed = hasFreshPreview && !loading && !notice

  return { preview, notice, loading, hasFreshPreview, feesConfirmed }
}
