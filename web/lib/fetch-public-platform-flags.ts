import { apiFetch } from "@/lib/api-client"
export type PublicPlatformFlags = {
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailVerificationRequired: boolean
  /** Whether "Pay online" (YooKassa) can be offered at Hub/Expert checkout. */
  yookassaEnabled: boolean
}

const DEFAULT_FLAGS: PublicPlatformFlags = {
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: true,
  yookassaEnabled: false,
}

export async function fetchPublicPlatformFlags(): Promise<PublicPlatformFlags> {
  try {
    const res = await apiFetch("/api/platform/public-flags")
    if (!res.ok) return DEFAULT_FLAGS
    const body = (await res.json()) as Partial<PublicPlatformFlags>
    return {
      maintenanceMode: Boolean(body.maintenanceMode),
      registrationEnabled: body.registrationEnabled !== false,
      emailVerificationRequired: body.emailVerificationRequired !== false,
      yookassaEnabled: Boolean(body.yookassaEnabled),
    }
  } catch {
    return DEFAULT_FLAGS
  }
}
