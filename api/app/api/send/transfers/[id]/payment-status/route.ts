import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { getInvoice, readSbpQrPayload } from "@/lib/bitbanker/invoices"

export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) => {
    const user = await requireUser(request)
    const resolved = await context.params
    const idParam = String(resolved?.id || "").trim().toUpperCase()

    const admin = createServerClient()
    const { data: tx, error } = await admin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .or(`transaction_id.eq.${idParam},id.eq.${idParam}`)
      .maybeSingle()

    if (error || !tx) {
      return createErrorResponse("Transaction not found", 404)
    }

    if (tx.payment_provider !== "bitbanker") {
      return NextResponse.json({
        transactionId: tx.transaction_id,
        status: tx.status,
        paymentProvider: tx.payment_provider,
      })
    }

    let payment = null as null | {
      amount: number | null
      link: string | null
      qrData: string | null
      invoiceId: string | null
      payed: boolean
    }

    if (tx.gateway_payment_id) {
      try {
        const invoice = await getInvoice({ id: tx.gateway_payment_id })
        const record = Array.isArray(invoice) ? invoice[0] : invoice
        const sbp = readSbpQrPayload(record as Record<string, unknown>)
        payment = {
          amount: sbp.amount,
          link: sbp.link ?? tx.gateway_confirmation_url,
          qrData: sbp.qrData,
          invoiceId: tx.gateway_payment_id,
          payed: Boolean((record as Record<string, unknown>)?.payed),
        }
      } catch {
        payment = {
          amount: tx.total_amount,
          link: tx.gateway_confirmation_url,
          qrData: null,
          invoiceId: tx.gateway_payment_id,
          payed: tx.status !== "pending",
        }
      }
    }

    return NextResponse.json({
      transactionId: tx.transaction_id,
      status: tx.status,
      paymentProvider: tx.payment_provider,
      payment,
    })
  },
)
