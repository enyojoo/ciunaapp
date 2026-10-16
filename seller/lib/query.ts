"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { ApiError, getActiveMerchantId } from "./api"

const cache = new Map<string, { at: number; data: unknown }>()
const STALE_MS = 15_000

/** Cached-first data hook: shows cached data instantly, revalidates in the background. Skeleton only when no cache. */
export function useQuery<T>(key: string | null, fetcher: () => Promise<T>, opts: { refreshMs?: number } = {}) {
  const scoped = key ? `${getActiveMerchantId() ?? "-"}:${key}` : null
  const [data, setData] = useState<T | undefined>(() => (scoped ? (cache.get(scoped)?.data as T | undefined) : undefined))
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(!data)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const load = useCallback(async () => {
    if (!scoped) return
    try {
      const fresh = await fetcherRef.current()
      cache.set(scoped, { at: Date.now(), data: fresh })
      setData(fresh)
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError("UNAVAILABLE", 0))
    } finally {
      setLoading(false)
    }
  }, [scoped])

  useEffect(() => {
    if (!scoped) return
    const hit = cache.get(scoped)
    if (hit) setData(hit.data as T)
    setLoading(!hit)
    if (!hit || Date.now() - hit.at > STALE_MS) void load()
    const onFocus = () => void load()
    window.addEventListener("focus", onFocus)
    const timer = opts.refreshMs ? setInterval(() => void load(), opts.refreshMs) : null
    return () => {
      window.removeEventListener("focus", onFocus)
      if (timer) clearInterval(timer)
    }
  }, [scoped, load, opts.refreshMs])

  return { data, error, loading, reload: load, setData }
}

export function invalidate(prefix?: string) {
  for (const k of Array.from(cache.keys())) if (!prefix || k.includes(`:${prefix}`)) cache.delete(k)
}
