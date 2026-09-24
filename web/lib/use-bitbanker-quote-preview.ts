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

export type BitbankerQuotePreviewLeg2 = {
  deskConfigured: boolean
  usdtForLocalPayout: number | null
  usdtFromBitbanker: number
}

export function useBitbankerQuotePreview(opts: {
  enabled: boolean
  sendAmount: string
  sendCurrency: string
  receiveCurrency: string
}) {
  const [preview, setPreview] = useState<BitbankerQuotePreview | null>(null)
  const [leg2, setLeg2] = useState<BitbankerQuotePreviewLeg2 | null>(null)
  const [errorNotice, setErrorNotice] = useState<SendQuotePreviewNotice | null>(null)
  const [deskHint, setDeskHint] = useState(false)
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    if (!opts.enabled) {
      setPreview(null)
      setLeg2(null)
      setErrorNotice(null)
      setDeskHint(false)
      setLoading(false)
      return
    }

    const amount = Number(opts.sendAmount)
    const min = minSendAmountForCurrency(opts.sendCurrency)
    if (!Number.isFinite(amount) || amount <= 0 || (min != null && amount < min)) {
      setPreview(null)
      setLeg2(null)
      setErrorNotice(null)
      setDeskHint(false)
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
            leg2?: BitbankerQuotePreviewLeg2
          }
          if (requestId.current !== id) return
          if (!res.ok) {
            setPreview(null)
            setLeg2(null)
            setDeskHint(false)
            setErrorNotice(noticeForQuotePreviewFailure(res.status, body.error, body.errorCode))
            return
          }
          const p = body.preview
          if (!p) {
            setPreview(null)
            setLeg2(null)
            setDeskHint(false)
            setErrorNotice(noticeForQuotePreviewFailure(400, "Invalid preview response"))
            return
          }
          setPreview(p)
          setLeg2(body.leg2 ?? null)
          setDeskHint(Boolean(body.leg2 && !body.leg2.deskConfigured))
          setErrorNotice(null)
        } catch {
          if (requestId.current !== id) return
          setPreview(null)
          setLeg2(null)
          setDeskHint(false)
          setErrorNotice(noticeForQuotePreviewNetworkFailure())
        } finally {
          if (requestId.current === id) setLoading(false)
        }
      })()
    }, 400)

    return () => {
      clearTimeout(timer)
      if (requestId.current === id) setLoading(false)
    }
  }, [opts.enabled, opts.sendAmount, opts.sendCurrency, opts.receiveCurrency])

  const feesConfirmed = Boolean(preview) && !loading && !errorNotice

  const deskHintNotice: SendQuotePreviewNotice | null = deskHint
    ? {
        kind: "info",
        messageKey: "send.quoteDeskRatePreviewHint",
        messageParams: { currency: opts.receiveCurrency },
      }
    : null

  return { preview, leg2, errorNotice, deskHintNotice, loading, feesConfirmed }
}
