"use client"

import { useEffect, useRef, useState } from "react"
import { minSendAmountForCurrency } from "@ciuna/shared"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import {
  noticeForQuotePreviewFailure,
  noticeForQuotePreviewNetworkFailure,
  type SendQuotePreviewNotice,
} from "@/lib/bitbanker-quote-notice"

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
  const [errorNotice, setErrorNotice] = useState<SendQuotePreviewNotice | null>(null)
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    if (!opts.enabled) {
      setPreview(null)
      setErrorNotice(null)
      setLoading(false)
      return
    }

    const amount = Number(opts.sendAmount)
    const min = minSendAmountForCurrency(opts.sendCurrency)
    if (!Number.isFinite(amount) || amount <= 0 || (min != null && amount < min)) {
      setPreview(null)
      setErrorNotice(null)
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
    }, 280)

    return () => {
      clearTimeout(timer)
      if (requestId.current === id) setLoading(false)
    }
  }, [opts.enabled, opts.sendAmount, opts.sendCurrency, opts.receiveCurrency])

  const feesConfirmed = Boolean(preview) && !loading && !errorNotice

  return { preview, errorNotice, loading, feesConfirmed }
}
