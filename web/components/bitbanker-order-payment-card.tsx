"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/currency"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import type { BitbankerSbpPaymentSummary } from "@ciuna/shared"

type PaymentStatusResponse = {
  status?: string
  payment?: BitbankerSbpPaymentSummary & { payed?: boolean }
}

export function BitbankerOrderPaymentCard({
  transactionId,
  totalRub,
  onStatusChange,
}: {
  transactionId: string
  totalRub: number
  onStatusChange?: (status: string) => void
}) {
  const [payment, setPayment] = useState<BitbankerSbpPaymentSummary | null>(null)
  const [status, setStatus] = useState("pending")

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const res = await fetchWithAuth(
        `/api/send/transfers/${encodeURIComponent(transactionId)}/payment-status`,
      )
      if (!res.ok || cancelled) return
      const body = (await res.json()) as PaymentStatusResponse
      if (body.status) {
        setStatus(body.status)
        onStatusChange?.(body.status)
      }
      if (body.payment) {
        setPayment({
          amount: body.payment.amount,
          link: body.payment.link,
          qrData: body.payment.qrData,
          invoiceId: body.payment.invoiceId,
        })
      }
    }
    void load()
    const id = setInterval(() => void load(), 8000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [transactionId, onStatusChange])

  const displayAmount = payment?.amount ?? totalRub

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <p className="font-medium text-gray-900">Pay with SBP</p>
      <p className="text-sm text-gray-600">Send exactly {formatCurrency(displayAmount, "RUB")}</p>
      {payment?.qrData ? (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={payment.qrData} alt="SBP QR code" className="max-w-[220px] rounded-lg border bg-white" />
        </div>
      ) : null}
      {payment?.link ? (
        <Button asChild variant="outline" className="w-full">
          <a href={payment.link} target="_blank" rel="noreferrer">
            Open SBP payment link
          </a>
        </Button>
      ) : null}
      <p className="text-xs text-center text-muted-foreground">Payment status: {status}</p>
    </div>
  )
}
