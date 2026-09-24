import type { KYCSubmission } from "@/lib/kyc-service"
import { officeFetch } from "@/lib/api-client"

/** Historical key; `v` must match or disk cache is discarded (payload shape changes). */
const DISK_CACHE_KEY = "ciuna_compliance_users"
const DISK_SCHEMA_VERSION = 3

export type OfficeBitbankerCompliance = {
  clientId?: string
  environment?: string
  isVerifiedForSbp: boolean
  formSnapshot?: Record<string, string> | null
  submittedAt?: string | null
}

export interface OfficeComplianceKycUser {
  userId: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  identity: KYCSubmission | null
  address: KYCSubmission | null
  bitbanker: OfficeBitbankerCompliance | null
}

let memoryRows: OfficeComplianceKycUser[] | null = null
let memoryLoadedAt: number | null = null
let inflight: Promise<OfficeComplianceKycUser[]> | null = null

function readDiskCache(): { rows: OfficeComplianceKycUser[]; timestamp: number | null } {
  if (typeof window === "undefined") return { rows: [], timestamp: null }
  try {
    const raw = localStorage.getItem(DISK_CACHE_KEY)
    if (!raw) return { rows: [], timestamp: null }
    const parsed = JSON.parse(raw) as {
      value?: OfficeComplianceKycUser[]
      timestamp?: number
      v?: number
    }
    if (parsed.v !== DISK_SCHEMA_VERSION) {
      try {
        localStorage.removeItem(DISK_CACHE_KEY)
      } catch {
        /* ignore */
      }
      return { rows: [], timestamp: null }
    }
    return { rows: parsed.value || [], timestamp: parsed.timestamp ?? null }
  } catch {
    return { rows: [], timestamp: null }
  }
}

function writeDiskCache(rows: OfficeComplianceKycUser[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      DISK_CACHE_KEY,
      JSON.stringify({
        value: rows,
        timestamp: Date.now(),
        v: DISK_SCHEMA_VERSION,
      }),
    )
  } catch {
    /* ignore */
  }
}

function memoryFresh(ttlMs: number): boolean {
  return (
    memoryRows != null &&
    memoryLoadedAt != null &&
    Date.now() - memoryLoadedAt < ttlMs
  )
}

function diskFresh(ttlMs: number): { rows: OfficeComplianceKycUser[] } | null {
  const { rows, timestamp } = readDiskCache()
  if (timestamp == null || Date.now() - timestamp >= ttlMs) return null
  return { rows }
}

async function fetchComplianceRows(): Promise<OfficeComplianceKycUser[]> {
  const response = await officeFetch("/api/admin/kyc")
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || response.statusText || "Failed to load KYC")
  }

  const body = (await response.json()) as {
    submissions?: KYCSubmission[]
    bitbanker?: Array<{
      user_id: string
      client_id?: string
      environment?: string
      is_verified_for_sbp?: boolean
      last_form_snapshot?: Record<string, string> | null
      last_form_submitted_at?: string | null
    }>
  }
  const submissions: KYCSubmission[] = body.submissions || []
  const bitbankerRows = body.bitbanker || []

  const userIds = [
    ...new Set([...submissions.map((s) => s.user_id), ...bitbankerRows.map((b) => b.user_id)]),
  ]
  const userMap = new Map<string, OfficeComplianceKycUser>()

  await Promise.all(
    userIds.map(async (userId) => {
      const subs = submissions.filter((s) => s.user_id === userId)
      const identity = subs.find((s) => s.type === "identity") ?? null
      const address = subs.find((s) => s.type === "address") ?? null
      const bb = bitbankerRows.find((b) => b.user_id === userId)
      const bitbanker: OfficeBitbankerCompliance | null = bb
        ? {
            clientId: bb.client_id,
            environment: bb.environment,
            isVerifiedForSbp: Boolean(bb.is_verified_for_sbp),
            formSnapshot: bb.last_form_snapshot ?? null,
            submittedAt: bb.last_form_submitted_at ?? null,
          }
        : null

      let email: string | undefined
      let first_name: string | undefined
      let last_name: string | undefined
      let phone: string | undefined

      try {
        const userResponse = await officeFetch(`/api/admin/users/${userId}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          email = userData.email
          first_name = userData.first_name
          last_name = userData.last_name
          phone = userData.phone
        }
      } catch {
        /* user row optional */
      }

      userMap.set(userId, {
        userId,
        email,
        first_name,
        last_name,
        phone,
        identity,
        address,
        bitbanker,
      })
    }),
  )

  return Array.from(userMap.values())
}

/**
 * Loads compliance KYC rows with TTL + in-flight dedupe (matches office `/transactions` UX).
 * Uses memory cache first, then disk (localStorage), then network.
 */
export function loadOfficeComplianceKycRows(
  ttlMs: number,
  options?: { force?: boolean },
): Promise<OfficeComplianceKycUser[]> {
  const force = Boolean(options?.force)

  if (force) {
    inflight = null
    memoryRows = null
    memoryLoadedAt = null
  }

  if (!force && memoryFresh(ttlMs) && memoryRows) {
    return Promise.resolve(memoryRows)
  }

  if (!force) {
    const disk = diskFresh(ttlMs)
    if (disk) {
      memoryRows = disk.rows
      memoryLoadedAt = Date.now()
      return Promise.resolve(disk.rows)
    }
  }

  if (inflight && !force) return inflight

  inflight = (async () => {
    try {
      const next = await fetchComplianceRows()
      memoryRows = next
      memoryLoadedAt = Date.now()
      writeDiskCache(next)
      return next
    } finally {
      inflight = null
    }
  })()

  return inflight
}

export function clearOfficeComplianceKycCache() {
  memoryRows = null
  memoryLoadedAt = null
  inflight = null
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(DISK_CACHE_KEY)
    } catch {
      /* ignore */
    }
  }
}

/** Synchronous seed from disk for instant first paint (any cached snapshot, including empty). */
export function readOfficeComplianceKycDiskSeed(): OfficeComplianceKycUser[] {
  const { rows, timestamp } = readDiskCache()
  if (timestamp == null) return []
  return rows
}

/** Memory or disk snapshot for first client paint (avoids skeleton on revisits). */
export function getOfficeComplianceKycClientBootstrap(): {
  rows: OfficeComplianceKycUser[]
  hasSnapshot: boolean
} {
  if (typeof window === "undefined") {
    return { rows: [], hasSnapshot: false }
  }
  if (memoryRows != null) {
    return { rows: memoryRows, hasSnapshot: true }
  }
  const { rows, timestamp } = readDiskCache()
  if (timestamp == null) {
    return { rows: [], hasSnapshot: false }
  }
  return { rows, hasSnapshot: true }
}

export function isOfficeComplianceDiskCacheFresh(ttlMs: number): boolean {
  const { timestamp } = readDiskCache()
  return timestamp != null && Date.now() - timestamp < ttlMs
}
