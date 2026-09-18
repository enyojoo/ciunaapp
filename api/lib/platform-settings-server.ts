import { unstable_cache } from "next/cache"
import { createServerClient } from "@/lib/supabase"

export type PublicPlatformFlags = {
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailVerificationRequired: boolean
}

const KEYS = [
  "maintenance_mode",
  "registration_enabled",
  "email_verification_required",
] as const

function parseRow(value: string | null | undefined, dataType: string | null | undefined): boolean {
  if (value == null) return false
  if (dataType === "boolean") return value === "true"
  return value === "true"
}

async function fetchPublicPlatformFlagsFromDb(): Promise<PublicPlatformFlags> {
  let supabase
  try {
    supabase = createServerClient()
  } catch (e) {
    console.error("fetchPublicPlatformFlagsFromDb: no server client", e)
    return {
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: true,
    }
  }
  const { data, error } = await supabase
    .from("system_settings")
    .select("key, value, data_type")
    .in("key", [...KEYS])

  if (error) {
    console.error("fetchPublicPlatformFlagsFromDb:", error)
    return {
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: true,
    }
  }

  const byKey = new Map<string, { value: string; data_type: string }>()
  for (const row of data || []) {
    if (row.key) byKey.set(row.key, { value: String(row.value ?? ""), data_type: String(row.data_type ?? "string") })
  }

  return {
    maintenanceMode: parseRow(byKey.get("maintenance_mode")?.value, byKey.get("maintenance_mode")?.data_type),
    registrationEnabled: byKey.has("registration_enabled")
      ? parseRow(byKey.get("registration_enabled")?.value, byKey.get("registration_enabled")?.data_type)
      : true,
    emailVerificationRequired: byKey.has("email_verification_required")
      ? parseRow(byKey.get("email_verification_required")?.value, byKey.get("email_verification_required")?.data_type)
      : true,
  }
}

/** Route handlers / RSC: cached read (Node runtime). */
export const getCachedPublicPlatformFlags = unstable_cache(
  async () => fetchPublicPlatformFlagsFromDb(),
  ["public-platform-flags"],
  { revalidate: 45 },
)

let edgeMemCache: { flags: PublicPlatformFlags; expires: number } | null = null
const EDGE_TTL_MS = 45_000

/** Middleware (Edge): short in-memory TTL per isolate. */
export async function getPublicPlatformFlagsEdgeCached(): Promise<PublicPlatformFlags> {
  const now = Date.now()
  if (edgeMemCache && edgeMemCache.expires > now) {
    return edgeMemCache.flags
  }
  const flags = await fetchPublicPlatformFlagsFromDb()
  edgeMemCache = { flags, expires: now + EDGE_TTL_MS }
  return flags
}
