import { resolveApiUrl } from "@ciuna/shared"

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

async function fetchPublicPlatformFlagsFromApi(): Promise<PublicPlatformFlags> {
  try {
    const res = await fetch(`${resolveApiUrl()}/api/platform/public-flags`, {
      cache: "no-store",
    })
    if (!res.ok) return DEFAULT_FLAGS
    const body = (await res.json()) as Partial<PublicPlatformFlags>
    return {
      maintenanceMode: Boolean(body.maintenanceMode),
      registrationEnabled: body.registrationEnabled !== false,
      emailVerificationRequired: body.emailVerificationRequired !== false,
    }
  } catch (e) {
    console.error("fetchPublicPlatformFlagsFromApi:", e)
    return DEFAULT_FLAGS
  }
}

let edgeMemCache: { flags: PublicPlatformFlags; expires: number } | null = null
const EDGE_TTL_MS = 45_000

/** Middleware (Edge): short in-memory TTL per isolate. */
export async function getPublicPlatformFlagsEdgeCached(): Promise<PublicPlatformFlags> {
  const now = Date.now()
  if (edgeMemCache && edgeMemCache.expires > now) {
    return edgeMemCache.flags
  }
  const flags = await fetchPublicPlatformFlagsFromApi()
  edgeMemCache = { flags, expires: now + EDGE_TTL_MS }
  return flags
}
