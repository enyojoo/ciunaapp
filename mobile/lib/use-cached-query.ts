import { useCallback, useEffect, useRef, useState } from "react"
import { isFresh, readCache, readCacheSync, writeCache } from "./cache"

/**
 * The shared data-loading foundation: paint cached data instantly (memory on a
 * warm re-mount, AsyncStorage on a cold start), then silently revalidate in
 * the background. `loading` only ever means "nothing to show yet" — a screen
 * with stale cached data is never blocked behind a spinner again.
 *
 * `key` may be `null` while a dependency (e.g. a vendor id) isn't ready yet;
 * the hook simply won't fetch until it is.
 */
export function useCachedQuery<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  opts?: { ttlMs?: number },
) {
  const ttlMs = opts?.ttlMs ?? 5 * 60_000
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const requestId = useRef(0)

  const [data, setData] = useState<T | null>(() => (key ? readCacheSync<T>(key)?.value ?? null : null))
  const [loading, setLoading] = useState(data === null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<unknown>(null)
  // `load` only depends on `key`, so it can't close over fresh `data` — a ref keeps the
  // "anything to show yet" check current instead of forever seeing the value from mount.
  const dataRef = useRef(data)
  dataRef.current = data

  const load = useCallback(
    async (opts2?: { silent?: boolean }) => {
      if (!key) return
      const id = ++requestId.current
      if (!opts2?.silent) setLoading((current) => current || dataRef.current === null)
      try {
        const fresh = await fetcherRef.current()
        if (requestId.current !== id) return
        setData(fresh)
        setError(null)
        void writeCache(key, fresh)
      } catch (err) {
        if (requestId.current !== id) return
        setError(err)
      } finally {
        if (requestId.current === id) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )

  useEffect(() => {
    if (!key) return
    let cancelled = false
    const mem = readCacheSync<T>(key)
    if (mem) {
      setData(mem.value)
      setLoading(false)
      if (isFresh(mem, ttlMs)) return
      void load({ silent: true })
      return
    }
    void (async () => {
      const stored = await readCache<T>(key)
      if (cancelled) return
      if (stored) {
        setData(stored.value)
        setLoading(false)
        if (!isFresh(stored, ttlMs)) void load({ silent: true })
      } else {
        void load()
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ttlMs])

  const refresh = useCallback(() => {
    setRefreshing(true)
    void load()
  }, [load])

  const revalidate = useCallback(() => {
    return load({ silent: true })
  }, [load])

  /** Optimistic local update (e.g. after a delete/edit) — also writes through to the cache. */
  const mutate = useCallback(
    (updater: T | ((current: T | null) => T)) => {
      setData((current) => {
        const next = typeof updater === "function" ? (updater as (current: T | null) => T)(current) : updater
        if (key) void writeCache(key, next)
        return next
      })
    },
    [key],
  )

  return { data, loading, refreshing, error, refresh, revalidate, mutate }
}
