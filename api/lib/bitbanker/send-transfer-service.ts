import type { SupabaseClient } from "@supabase/supabase-js"
import { generateTransactionId } from "@/lib/transaction-id"
import { roundMoney } from "@/utils/currency"
import { getOrCreateClientRef } from "./db"
import { createBitbankerSendInvoice, readSbpQrPayload } from "./invoices"
import { getOpenQuote } from "./send-quote-service"
import { getPartnerClient, readVerifiedForSbp } from "./partner-clients"

const SBP_INVOICE_BLOCKED =
  "Bitbanker SBP invoice requires a verified partner client. Complete identity verification once in sandbox (Bitbanker IDX), then retry. Ciuna’s verification gate bypass does not skip Bitbanker’s API."

async function assertPartnerClientReadyForSbpInvoice(clientId: string, localVerified: boolean): Promise<void> {
  if (localVerified) return
  try {
    const remote = await getPartnerClient(clientId)
    if (readVerifiedForSbp(remote)) return
  } catch {
    /* fall through */
  }
  throw new Error(SBP_INVOICE_BLOCKED)
}

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

  if (existingAttempt?.status === "pending" && !existingAttempt.bitbanker_invoice_id) {
    return finishAttemptFromPendingInvoice(admin, quote, params.userId, existingAttempt, params.idempotencyKey)
  }

  if (existingAttempt?.bitbanker_invoice_id) {
    let transaction = null as Record<string, unknown> | null
    if (existingAttempt.transaction_id) {
      const { data: existingTx } = await admin
        .from("transactions")
        .select("*")
        .eq("id", existingAttempt.transaction_id)
        .maybeSingle()
      transaction = existingTx
    }
    if (!transaction) {
      transaction = await insertTransactionFromQuote(admin, quote, params.userId, existingAttempt)
    }
    const sbpPayload = existingAttempt.sbp_payload as Record<string, unknown> | null
    const sbp = sbpPayload ? readSbpQrPayload(sbpPayload) : { link: null, qrData: null, amount: existingAttempt.sbp_payable_amount }
    return {
      transaction: {
        ...transaction,
        gateway_payment_id: existingAttempt.bitbanker_invoice_id,
        gateway_confirmation_url: sbp.link,
      },
      payment: {
        amount: roundMoney(Number(sbp.amount ?? existingAttempt.sbp_payable_amount)),
        currency: "RUB",
        link: sbp.link,
        qrData: sbp.qrData,
        invoiceId: existingAttempt.bitbanker_invoice_id,
      },
      reused: true,
    }
  }

  const { data: pendingAttempt, error: attemptErr } = await admin
    .from("bitbanker_payment_attempts")
    .insert({
      send_quote_id: quote.id,
      idempotency_key: params.idempotencyKey,
      status: "pending",
    })
    .select("*")
    .single()

  if (attemptErr) throw attemptErr

  await assertPartnerClientReadyForSbpInvoice(ref.client_id, ref.is_verified_for_sbp)

  let invoice: Record<string, unknown>
  try {
    invoice = (await createBitbankerSendInvoice(
      {
        partnerClientExternalId: ref.client_id,
        invoiceBaseB: quote.invoice_base_b,
        description: `Ciuna send quote ${quote.id}`,
      },
      params.idempotencyKey,
    )) as Record<string, unknown>
  } catch (e) {
    await admin.from("bitbanker_payment_attempts").update({ status: "failed" }).eq("id", pendingAttempt.id)
    throw e
  }

  const invoiceId = String(invoice.id ?? "").trim()
  const sbp = readSbpQrPayload(invoice)
  const payable = sbp.amount ?? quote.total_amount
  if (Math.abs(Number(payable) - Number(quote.total_amount)) > 0.02) {
    await admin
      .from("bitbanker_payment_attempts")
      .update({
        status: "failed",
        bitbanker_invoice_id: invoiceId || null,
        sbp_payload: invoice,
      })
      .eq("id", pendingAttempt.id)
    throw new Error("Payable amount mismatch; quote must be refreshed")
  }

  await admin
    .from("bitbanker_payment_attempts")
    .update({
      bitbanker_invoice_id: invoiceId,
      sbp_payable_amount: payable,
      sbp_payload: invoice,
      status: "invoice_created",
    })
    .eq("id", pendingAttempt.id)

  const transaction = await insertTransactionFromQuote(admin, quote, params.userId, {
    ...pendingAttempt,
    bitbanker_invoice_id: invoiceId,
    sbp_payable_amount: payable,
    sbp_payload: invoice,
  })

  await admin
    .from("bitbanker_payment_attempts")
    .update({ transaction_id: transaction.id })
    .eq("id", pendingAttempt.id)

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

async function finishAttemptFromPendingInvoice(
  admin: SupabaseClient,
  quote: Record<string, unknown>,
  userId: string,
  attempt: Record<string, unknown>,
  idempotencyKey: string,
) {
  const ref = await getOrCreateClientRef(admin, userId)
  await assertPartnerClientReadyForSbpInvoice(ref.client_id, ref.is_verified_for_sbp)

  let invoice: Record<string, unknown>
  try {
    invoice = (await createBitbankerSendInvoice(
      {
        partnerClientExternalId: ref.client_id,
        invoiceBaseB: Number(quote.invoice_base_b),
        description: `Ciuna send quote ${quote.id}`,
      },
      idempotencyKey,
    )) as Record<string, unknown>
  } catch (e) {
    await admin.from("bitbanker_payment_attempts").update({ status: "failed" }).eq("id", attempt.id)
    throw e
  }

  return finishInvoiceAttempt(admin, quote, userId, attempt, invoice)
}

function finishInvoiceAttempt(
  admin: SupabaseClient,
  quote: Record<string, unknown>,
  userId: string,
  attempt: Record<string, unknown>,
  invoice: Record<string, unknown>,
) {
  const invoiceId = String(invoice.id ?? "").trim()
  const sbp = readSbpQrPayload(invoice)
  const payable = sbp.amount ?? quote.total_amount
  if (Math.abs(Number(payable) - Number(quote.total_amount)) > 0.02) {
    return admin
      .from("bitbanker_payment_attempts")
      .update({ status: "failed", bitbanker_invoice_id: invoiceId || null, sbp_payload: invoice })
      .eq("id", attempt.id)
      .then(() => {
        throw new Error("Payable amount mismatch; quote must be refreshed")
      })
  }

  return (async () => {
    await admin
      .from("bitbanker_payment_attempts")
      .update({
        bitbanker_invoice_id: invoiceId,
        sbp_payable_amount: payable,
        sbp_payload: invoice,
        status: "invoice_created",
      })
      .eq("id", attempt.id)

    const transaction = await insertTransactionFromQuote(admin, quote, userId, {
      ...attempt,
      bitbanker_invoice_id: invoiceId,
      sbp_payable_amount: payable,
      sbp_payload: invoice,
    })

    await admin.from("bitbanker_payment_attempts").update({ transaction_id: transaction.id }).eq("id", attempt.id)

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
  })()
}

async function insertTransactionFromQuote(
  admin: SupabaseClient,
  quote: Record<string, unknown>,
  userId: string,
  attempt: Record<string, unknown>,
) {
  const invoiceId = String(attempt.bitbanker_invoice_id ?? "").trim()
  const sbp = attempt.sbp_payload ? readSbpQrPayload(attempt.sbp_payload as Record<string, unknown>) : { link: null }

  const transactionId = generateTransactionId()
  const { data: transaction, error: txErr } = await admin
    .from("transactions")
    .insert({
      transaction_id: transactionId,
      user_id: userId,
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
      gateway_payment_id: invoiceId || null,
      gateway_status: invoiceId ? "pending" : null,
      gateway_confirmation_url: sbp.link,
    })
    .select("*")
    .single()

  if (txErr) throw txErr
  return transaction
}
