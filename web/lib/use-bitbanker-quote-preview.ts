"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  BITBANKER_QUOTE_PREVIEW_DEBOUNCE_MS,
  bitbankerQuotePreviewMatchesInput,
  minSendAmountForCurrency,
} from "@ciuna/shared"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import {
  noticeForQuotePreviewFailure,
  noticeForQuotePreviewNetworkFailure,
  type SendQuotePreviewNotice,
} from "@/lib/bitbanker-quote-notice"

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
  const [errorNotice, setErrorNotice] = useState<SendQuotePreviewNotice | null>(null)
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
      setErrorNotice(null)
      setLoading(false)
      return
    }

    if (!amountValid) {
      setPreview(null)
      setErrorNotice(null)
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
            setPreview(null)
            setErrorNotice(noticeForQuotePreviewFailure(res.status, body.error, body.errorCode))
            return
          }
          const p = body.preview
          if (!p) {
            setPreview(null)
            setErrorNotice(noticeForQuotePreviewFailure(400, "Invalid preview response"))
            return
          }
          setPreview(p)
          setErrorNotice(null)
        } catch {
          if (requestId.current !== id) return
          setPreview(null)
          setErrorNotice(noticeForQuotePreviewNetworkFailure())
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

  const feesConfirmed = Boolean(previewForInput) && !loading && !errorNotice

  return { preview: previewForInput, errorNotice, loading, feesConfirmed }
}
