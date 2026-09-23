"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/currency"
import { fetchWithAuth } from "@/lib/fetch-with-auth"

export type BitbankerPaymentPayload = {
  amount: number
  currency: string
  link: string | null
  qrData: string | null
  invoiceId: string | null
}

type Props = {
  transactionId: string
  totalRub: number
  payment: BitbankerPaymentPayload
  onBack: () => void
  onDone: () => void
}

export function SendBitbankerPaymentStep({ transactionId, totalRub, payment, onBack, onDone }: Props) {
  const [status, setStatus] = useState<string>("pending")

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      const res = await fetchWithAuth(
        `/api/send/transfers/${encodeURIComponent(transactionId)}/payment-status`,
      )
      if (!res.ok || cancelled) return
      const body = (await res.json()) as { status?: string }
      if (body.status) setStatus(body.status)
      if (body.status === "processing" || body.status === "completed") {
        onDone()
      }
    }
    void poll()
    const id = setInterval(() => void poll(), 8000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [transactionId, onDone])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay with SBP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">Send exactly</p>
        <p className="text-center text-2xl font-semibold tabular-nums">{formatCurrency(totalRub, "RUB")}</p>
        <p className="text-center text-xs text-muted-foreground">Reference {transactionId}</p>
        {payment.qrData ? (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={payment.qrData} alt="SBP QR code" className="max-w-[240px] rounded-lg border" />
          </div>
        ) : null}
        {payment.link ? (
          <p className="text-center text-sm break-all">
            <a href={payment.link} className="text-primary underline" target="_blank" rel="noreferrer">
              Open payment link
            </a>
          </p>
        ) : null}
        <p className="text-center text-xs text-muted-foreground">Status: {status}</p>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
            Back
          </Button>
          <Button type="button" className="flex-1" onClick={onDone}>
            View order
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
