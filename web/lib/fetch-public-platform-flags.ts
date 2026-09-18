import { apiFetch } from "@/lib/api-client"
export type PublicPlatformFlags = {
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailVerificationRequired: boolean
}

const DEFAULT_FLAGS: PublicPlatformFlags = {
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: true,
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
    }
  } catch {
    return DEFAULT_FLAGS
  }
}
