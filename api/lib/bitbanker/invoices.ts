import { bitbankerRequest } from "./client"

export type CreateInvoiceBody = Record<string, unknown> & {
  client_id: string
  currency: string
  amount: number | string
  description?: string
  auto_withdraw?: boolean
  crypto_payment?: boolean
}

export type CreateInvoiceResponse = Record<string, unknown> & {
  id?: string
  link?: string
  sbp_payment?: Record<string, unknown>
  full_sign?: string
}

export type InvoiceRecord = Record<string, unknown> & {
  id?: string
  payed?: boolean
  sbp_info?: Record<string, unknown>
  exchange?: unknown[]
}

export async function createInvoice(
  body: CreateInvoiceBody,
  idempotencyKey: string,
): Promise<CreateInvoiceResponse> {
  return bitbankerRequest<CreateInvoiceResponse>({
    method: "POST",
    path: "/api/v2/invoices",
    body: {
      auto_withdraw: false,
      crypto_payment: false,
      ...body,
      currency: body.currency ?? "RUBR",
    },
    idempotencyKey,
  })
}

export async function getInvoice(params: {
  id?: string
  clientId?: string
}): Promise<InvoiceRecord | InvoiceRecord[]> {
  return bitbankerRequest({
    method: "GET",
    path: "/api/v2/invoices",
    query: {
      id: params.id,
      client_id: params.clientId,
    },
    signBody: false,
  })
}

export function readSbpPayableAmount(invoice: InvoiceRecord): number | null {
  const sbpInfo = invoice.sbp_info as Record<string, unknown> | undefined
  const sbpPayment = invoice.sbp_payment as Record<string, unknown> | undefined
  const raw =
    sbpInfo?.amount ??
    sbpPayment?.amount ??
    (invoice as Record<string, unknown>).amount
  if (raw == null) return null
  const n = typeof raw === "number" ? raw : Number(raw)
  return Number.isFinite(n) ? n : null
}

export function readSbpQrPayload(invoice: CreateInvoiceResponse | InvoiceRecord): {
  amount: number | null
  link: string | null
  qrData: string | null
} {
  const sbp = (invoice.sbp_payment ?? invoice.sbp_info) as Record<string, unknown> | undefined
  const link =
    (typeof invoice.link === "string" ? invoice.link : null) ??
    (typeof sbp?.link === "string" ? sbp.link : null) ??
    (typeof sbp?.url === "string" ? sbp.url : null)
  const qrData =
    (typeof sbp?.qr === "string" ? sbp.qr : null) ??
    (typeof sbp?.qr_code === "string" ? sbp.qr_code : null) ??
    null
  return {
    amount: readSbpPayableAmount(invoice as InvoiceRecord),
    link,
    qrData,
  }
}
