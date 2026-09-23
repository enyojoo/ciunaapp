import type { SupabaseClient } from "@supabase/supabase-js"
import { generateTransactionId } from "@/lib/transaction-id"
import { roundMoney } from "@/utils/currency"
import { getOrCreateClientRef } from "./db"
import { createInvoice, readSbpQrPayload } from "./invoices"
import { getOpenQuote } from "./send-quote-service"

export async function acceptSendQuoteAndCreateInvoice(
  admin: SupabaseClient,
  params: { userId: string; quoteId: string; idempotencyKey: string },
) {
  const quote = await getOpenQuote(admin, params.quoteId, params.userId)
  const ref = await getOrCreateClientRef(admin, params.userId)

  const { data: existingAttempt } = await admin
    .from("bitbanker_payment_attempts")
    .select("*")
    .eq("idempotency_key", params.idempotencyKey)
    .maybeSingle()

  if (existingAttempt?.transaction_id && existingAttempt.bitbanker_invoice_id) {
    const { data: existingTx } = await admin
      .from("transactions")
      .select("*")
      .eq("id", existingAttempt.transaction_id)
      .maybeSingle()
    if (existingTx) {
      const sbpPayload = existingAttempt.sbp_payload as Record<string, unknown> | null
      return {
        transaction: existingTx,
        payment: sbpPayload ?? existingAttempt.sbp_payload,
        reused: true,
      }
    }
  }

  const transactionId = generateTransactionId()
  const { data: transaction, error: txErr } = await admin
    .from("transactions")
    .insert({
      transaction_id: transactionId,
      user_id: params.userId,
      recipient_id: quote.recipient_id,
      send_amount: quote.send_amount,
      send_currency: quote.send_currency,
      receive_amount: quote.receive_amount,
      receive_currency: quote.receive_currency,
      exchange_rate: quote.exchange_rate,
      fee_amount: quote.fee_amount,
      fee_type: quote.fee_type,
      total_amount: quote.total_amount,
      payment_processing_fee: quote.payment_processing_fee,
      fulfillment_type: quote.fulfillment_type,
      logistics_fee_amount: quote.logistics_fee_amount,
      delivery_address_line: quote.delivery_address_line,
      delivery_phone: quote.delivery_phone,
      delivery_address_id: quote.delivery_address_id,
      send_quote_id: quote.id,
      payment_provider: "bitbanker",
      status: "pending",
    })
    .select("*")
    .single()

  if (txErr) throw txErr

  const invoice = await createInvoice(
    {
      client_id: ref.client_id,
      currency: "RUBR",
      amount: quote.invoice_base_b,
      description: `Ciuna send ${transactionId}`,
    },
    params.idempotencyKey,
  )

  const invoiceId = String(invoice.id ?? "").trim()
  const sbp = readSbpQrPayload(invoice)
  const payable = sbp.amount ?? quote.total_amount
  if (Math.abs(Number(payable) - Number(quote.total_amount)) > 0.02) {
    throw new Error("Payable amount mismatch; quote must be refreshed")
  }

  await admin.from("bitbanker_payment_attempts").insert({
    send_quote_id: quote.id,
    transaction_id: transaction.id,
    idempotency_key: params.idempotencyKey,
    bitbanker_invoice_id: invoiceId,
    sbp_payable_amount: payable,
    sbp_payload: invoice,
    status: "invoice_created",
  })

  await admin
    .from("transactions")
    .update({
      gateway_payment_id: invoiceId,
      gateway_status: "pending",
      gateway_confirmation_url: sbp.link,
    })
    .eq("id", transaction.id)

  await admin
    .from("send_quotes")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", quote.id)

  return {
    transaction: {
      ...transaction,
      gateway_payment_id: invoiceId,
      gateway_confirmation_url: sbp.link,
    },
    payment: {
      amount: roundMoney(Number(payable)),
      currency: "RUB",
      link: sbp.link,
      qrData: sbp.qrData,
      invoiceId,
    },
    reused: false,
  }
}
