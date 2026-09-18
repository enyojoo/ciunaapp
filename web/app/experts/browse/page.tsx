"use client"

import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { HubServiceLineRow } from "@/lib/hub-service-line-types"
import {
  hubPublicHubJsonCacheUserId,
  isHubServiceLinesCacheFresh,
  readStaleHubServiceLinesCache,
  scheduleHubServiceLinesStaleWhileRevalidate,
  writeHubServiceLinesCache,
} from "@/lib/hub-client-cache"
import {
  isExpertProfilesListCacheFresh,
  readStaleExpertProfilesListCache,
  writeExpertProfilesListCache,
} from "@/lib/expert-profile-client-cache"
import { HubExpertCatalogCard, type ExpertCatalogProfile } from "@/components/hub/hub-expert-catalog-card"
import { HubLinePageShell } from "@/components/hub/hub-line-page-shell"
import { EXPERTS_CATALOG_PATH } from "@/lib/experts-public-paths"
import { apiFetch } from "@/lib/api-client"

const SERVICE_LINES_CACHE_USER = hubPublicHubJsonCacheUserId()

type ExpertProfile = ExpertCatalogProfile & {
  bio: string | null
  category?: string | null
  created_at?: string
}

export default function ExpertsBrowsePage() {
  const { t } = useTranslation("app")
  const [lines, setLines] = useState<HubServiceLineRow[]>([])
  const [linesLoaded, setLinesLoaded] = useState(false)
  const [profiles, setProfiles] = useState<ExpertProfile[]>([])
  const [loading, setLoading] = useState(true)

  const expertsLine = useMemo(() => lines.find((l) => l.slug === "experts") ?? null, [lines])

  useLayoutEffect(() => {
    const stale = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
    if (stale !== null) {
      setLines(stale)
      setLinesLoaded(true)
    }
  }, [])

  useLayoutEffect(() => {
    const stale = readStaleExpertProfilesListCache()
    if (stale && stale.length > 0) {
      setProfiles(stale as ExpertProfile[])
    }
    const hasRows = (stale?.length ?? 0) > 0
    if (!isExpertProfilesListCacheFresh() && !hasRows) setLoading(true)
    else setLoading(false)
  }, [])

  useEffect(() => {
    if (isHubServiceLinesCacheFresh(SERVICE_LINES_CACHE_USER)) {
      const s = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
      if (s) setLines(s)
      setLinesLoaded(true)
      scheduleHubServiceLinesStaleWhileRevalidate(SERVICE_LINES_CACHE_USER, async () => {
        const res = await apiFetch("/api/hub/service-lines", { cache: "no-store" })
        if (!res.ok) return null
        const data = await res.json()
        return (data.serviceLines || []) as HubServiceLineRow[]
      }, setLines)
      return
    }

    let cancelled = false
    const silent = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER) !== null
    ;(async () => {
      try {
        const res = await apiFetch("/api/hub/service-lines", { cache: "no-store" })
        if (!res.ok) throw new Error("lines")
        const data = await res.json()
        const next = (data.serviceLines || []) as HubServiceLineRow[]
        if (!cancelled) {
          setLines(next)
          writeHubServiceLinesCache(SERVICE_LINES_CACHE_USER, next)
        }
      } catch {
        if (!cancelled && !silent) setLines([])
      } finally {
        if (!cancelled) setLinesLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isExpertProfilesListCacheFresh()) return

    let cancelled = false
    const silent = (readStaleExpertProfilesListCache()?.length ?? 0) > 0
    if (!silent) setLoading(true)

    ;(async () => {
      try {
        const res = await apiFetch("/api/expert/profiles", { cache: "no-store" })
        if (!res.ok) throw new Error("profiles")
        const data = await res.json()
        const next = (data.profiles || []) as ExpertProfile[]
        if (!cancelled) {
          setProfiles(next)
          writeExpertProfilesListCache(next)
        }
      } catch {
        if (!cancelled) setProfiles([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return tb - ta
    })
  }, [profiles])

  const title = t("hub.expertsDirectoryTitle", { defaultValue: "All experts" })
  const subtitle = t("hub.expertsDirectorySubtitle", { defaultValue: "Browse every expert on Ciuna." })

  if (linesLoaded && expertsLine && !expertsLine.is_enabled) {
    return (
      <HubLinePageShell
        title={t("hub.unavailableTitle")}
        subtitle={null}
        backToHubAriaLabel={t("hub.backToHub")}
        backHref="/hub"
      >
        <p className="text-center text-sm text-muted-foreground">{t("hub.serviceUnavailable")}</p>
      </HubLinePageShell>
    )
  }

  return (
    <HubLinePageShell
      title={title}
      subtitle={subtitle}
      backToHubAriaLabel={t("hub.backToExperts", { defaultValue: "Back to experts" })}
      backHref={EXPERTS_CATALOG_PATH}
    >
      {loading && profiles.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square max-h-[220px] rounded-2xl bg-muted" />
          ))}
        </div>
      ) : sortedProfiles.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t("hub.expertsEmpty", { defaultValue: "No experts listed yet." })}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {sortedProfiles.map((ex) => (
            <div key={ex.id} className="h-full min-w-0">
              <HubExpertCatalogCard expert={ex} className="h-full" />
            </div>
          ))}
        </div>
      )}
    </HubLinePageShell>
  )
}
