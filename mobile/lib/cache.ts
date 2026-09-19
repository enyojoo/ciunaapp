import AsyncStorage from "@react-native-async-storage/async-storage"

/**
 * Generic stale-while-revalidate cache: an in-memory `Map` (instant, for
 * warm-session re-mounts like switching tabs) backed by AsyncStorage (survives
 * a cold app restart, one microtask slower). One implementation for the whole
 * app — mirrors the pattern web/lib/*-cache.ts uses, but web reimplements this
 * per domain; here every screen shares the same primitive via `useCachedQuery`.
 */

export type CacheEntry<T> = { value: T; timestamp: number }

const memory = new Map<string, CacheEntry<unknown>>()

function isValidEntry(parsed: unknown): parsed is CacheEntry<unknown> {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    "timestamp" in parsed &&
    typeof (parsed as { timestamp: unknown }).timestamp === "number"
  )
}

/** Synchronous, in-memory only. Use for the first-render hydration in a hook. */
export function readCacheSync<T>(key: string): CacheEntry<T> | null {
  return (memory.get(key) as CacheEntry<T> | undefined) ?? null
}

/** Memory first, then AsyncStorage (backfilling memory on hit). */
export async function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
  const mem = memory.get(key)
  if (mem) return mem as CacheEntry<T>
  try {
    const raw = await AsyncStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isValidEntry(parsed)) return null
    memory.set(key, parsed)
    return parsed as CacheEntry<T>
  } catch {
    return null
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  const entry: CacheEntry<T> = { value, timestamp: Date.now() }
  memory.set(key, entry)
  try {
    await AsyncStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // best-effort persistence; the in-memory copy still makes this session fast
  }
}

export function isFresh(entry: CacheEntry<unknown> | null, ttlMs: number): boolean {
  return entry != null && Date.now() - entry.timestamp < ttlMs
}

/** Drop cached entries on sign-out (or all of them when no prefix is given). */
export function clearCacheMemory(prefix?: string): void {
  if (!prefix) {
    memory.clear()
    return
  }
  for (const key of memory.keys()) {
    if (key.startsWith(prefix)) memory.delete(key)
  }
}
