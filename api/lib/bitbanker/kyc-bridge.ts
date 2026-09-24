import { bitbankerRequest } from "./client"

export type KycRequestResponse = {
  kyc_url?: string
  payment_url?: string
  provider?: string
}

/** POST /api/v1/kyc-request — unsigned request and response per Bitbanker contract. */
export async function requestHostedKycSession(input: {
  externalClientRef: string
  email: string
}): Promise<KycRequestResponse> {
  return bitbankerRequest<KycRequestResponse>({
    method: "POST",
    path: "/api/v1/kyc-request",
    body: {
      external_client_ref: input.externalClientRef,
      email: input.email.trim(),
    },
    signBody: false,
    verifyResponse: false,
  })
}
