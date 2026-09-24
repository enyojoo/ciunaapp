import { useEffect, useMemo, useRef, useState } from "react"
import {
  BITBANKER_QUOTE_PREVIEW_DEBOUNCE_MS,
  bitbankerQuotePreviewMatchesInput,
  minSendAmountForCurrency,
} from "@ciuna/shared"
import {
  noticeForQuotePreviewFailure,
  noticeForQuotePreviewNetworkFailure,
  type SendQuotePreviewNotice,
} from "./bitbanker-quote-notice"
import { fetchWithAuth } from "./api"

export type BitbankerQuotePreview = {
  sendAmount: number
  sendCurrency: string
  receiveCurrency: string
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

  const parsedAmount = Number(opts.sendAmount)
  const min = minSendAmountForCurrency(opts.sendCurrency)
  const amountValid =
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    (min == null || parsedAmount >= min)

  const inputKey = useMemo(
    () =>
      `${opts.sendCurrency}:${opts.receiveCurrency}:${opts.sendAmount}`,
    [opts.sendCurrency, opts.receiveCurrency, opts.sendAmount],
  )

  useEffect(() => {
    if (!opts.enabled) {
      setPreview(null)
      setNotice(null)
      setLoading(false)
      return
    }

    if (!amountValid) {
      setPreview(null)
      setNotice(null)
      setLoading(false)
      return
    }

    const amount = parsedAmount
    const sendCurrency = opts.sendCurrency
    const receiveCurrency = opts.receiveCurrency
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
              sendCurrency,
              receiveCurrency,
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
    }, BITBANKER_QUOTE_PREVIEW_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [opts.enabled, inputKey, amountValid])

  const previewForInput = useMemo(() => {
    if (!preview || !amountValid) return null
    return bitbankerQuotePreviewMatchesInput(preview, {
      sendAmount: parsedAmount,
      sendCurrency: opts.sendCurrency,
      receiveCurrency: opts.receiveCurrency,
    })
      ? preview
      : null
  }, [preview, amountValid, parsedAmount, opts.sendCurrency, opts.receiveCurrency])

  const feesConfirmed = Boolean(previewForInput) && !loading && !notice
  const feesPending = opts.enabled && amountValid && !feesConfirmed && !notice

  return {
    preview: previewForInput,
    notice,
    loading,
    feesPending,
    feesConfirmed,
    hasFreshPreview: Boolean(previewForInput),
  }
}
