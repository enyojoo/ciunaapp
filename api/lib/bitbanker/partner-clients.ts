import { bitbankerRequest } from "./client"

export type PartnerClientRegistrationBody = Record<string, unknown> & {
  client_id: string
  email: string
  phone?: string
}

export type PartnerClientRecord = Record<string, unknown> & {
  client_id?: string
  is_verified_for_sbp?: boolean
  full_sign?: string
}

export async function registerPartnerClient(
  body: PartnerClientRegistrationBody,
  idempotencyKey: string,
): Promise<PartnerClientRecord> {
  return bitbankerRequest<PartnerClientRecord>({
    method: "POST",
    path: "/api/v2/partner-clients",
    body,
    idempotencyKey,
  })
}

export async function getPartnerClient(clientId: string): Promise<PartnerClientRecord> {
  return bitbankerRequest<PartnerClientRecord>({
    method: "GET",
    path: "/api/v2/partner-clients",
    query: { client_id: clientId },
    signQuery: true,
  })
}

export function readVerifiedForSbp(record: PartnerClientRecord): boolean {
  const v = record.is_verified_for_sbp
  if (typeof v === "boolean") return v
  if (v === "true" || v === 1) return true
  return false
}
