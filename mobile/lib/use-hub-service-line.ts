import { useEffect, useState } from "react"
import { findHubServiceLineBySlug, type HubServiceLineRow } from "@ciuna/shared"
import { fetchWithAuth } from "@/lib/api"

/** Office Hub Services row for a route slug (Home grid CMS). */
export function useHubServiceLine(slug: string) {
  const [line, setLine] = useState<HubServiceLineRow | null>(null)

  useEffect(() => {
    const key = slug.trim()
    if (!key) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetchWithAuth("/api/hub/service-lines", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as { serviceLines?: HubServiceLineRow[] }
        if (cancelled) return
        setLine(findHubServiceLineBySlug(data.serviceLines || [], key))
      } catch {
        /* shell falls back to locale copy */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  return line
}
