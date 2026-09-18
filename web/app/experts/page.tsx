"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import type { HubServiceLineRow } from "@/lib/hub-service-line-types"
import {
  hubPublicHubJsonCacheUserId,
  isHubServiceLinesCacheFresh,
  readStaleHubServiceLinesCache,
  scheduleHubServiceLinesStaleWhileRevalidate,
  writeHubServiceLinesCache,
} from "@/lib/hub-client-cache"
import {
  isExpertCatalogServicesListCacheFresh,
  isExpertProfilesListCacheFresh,
  readStaleExpertCatalogServicesListCache,
  readStaleExpertProfilesListCache,
  writeExpertCatalogServicesListCache,
  writeExpertProfilesListCache,
} from "@/lib/expert-profile-client-cache"
import {
  HubExpertCatalogFeaturedChip,
  type ExpertCatalogProfile,
} from "@/components/hub/hub-expert-catalog-card"
import { HubExpertServiceCatalogCard, type ExpertCatalogService } from "@/components/hub/hub-expert-service-catalog-card"
import { HubLinePageShell } from "@/components/hub/hub-line-page-shell"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EXPERTS_BROWSE_PATH } from "@/lib/experts-public-paths"
import { hubServiceLineShellLabels } from "@/lib/hub-service-line-i18n"
import { apiFetch } from "@/lib/api-client"

const ALL_CATEGORIES_VALUE = "__all__"
const FEATURED_PREVIEW_COUNT = 8

const SERVICE_LINES_CACHE_USER = hubPublicHubJsonCacheUserId()

type ExpertProfile = ExpertCatalogProfile & {
  bio: string | null
  category?: string | null
  created_at?: string
}

function ExpertsDiscoveryInner() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategory = (searchParams.get("category") || "").trim()

  const [lines, setLines] = useState<HubServiceLineRow[]>([])
  const [linesLoaded, setLinesLoaded] = useState(false)
  const [profiles, setProfiles] = useState<ExpertProfile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [catalogServices, setCatalogServices] = useState<ExpertCatalogService[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)

  useLayoutEffect(() => {
    const stale = readStaleExpertProfilesListCache()
    if (stale && stale.length > 0) {
      setProfiles(stale as ExpertProfile[])
    }
    const hasRows = (stale?.length ?? 0) > 0
    const fresh = isExpertProfilesListCacheFresh()
    if (!fresh && !hasRows) setLoadingProfiles(true)
    else setLoadingProfiles(false)
  }, [])

  useLayoutEffect(() => {
    const stale = readStaleExpertCatalogServicesListCache()
    if (stale && stale.length > 0) {
      setCatalogServices(stale)
    }
    const hasRows = (stale?.length ?? 0) > 0
    const fresh = isExpertCatalogServicesListCacheFresh()
    if (!fresh && !hasRows) setLoadingCatalog(true)
    else setLoadingCatalog(false)
  }, [])

  const expertsLine = useMemo(() => lines.find((l) => l.slug === "experts") ?? null, [lines])

  useLayoutEffect(() => {
    const stale = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
    if (stale !== null) {
      setLines(stale)
      setLinesLoaded(true)
    }
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
    if (!silent) setLoadingProfiles(true)

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
        if (!cancelled) setLoadingProfiles(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isExpertCatalogServicesListCacheFresh()) return

    let cancelled = false
    const silent = (readStaleExpertCatalogServicesListCache()?.length ?? 0) > 0
    if (!silent) setLoadingCatalog(true)

    ;(async () => {
      try {
        const res = await apiFetch("/api/expert/catalog-services", { cache: "no-store" })
        if (!res.ok) throw new Error("catalog")
        const data = await res.json()
        const list = (data.services || []) as ExpertCatalogService[]
        if (!cancelled) {
          setCatalogServices(list)
          writeExpertCatalogServicesListCache(list)
        }
      } catch {
        if (!cancelled) setCatalogServices([])
      } finally {
        if (!cancelled) setLoadingCatalog(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const featuredPreview = useMemo(() => {
    const sorted = [...profiles].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return tb - ta
    })
    return sorted.slice(0, FEATURED_PREVIEW_COUNT)
  }, [profiles])

  const displayedServices = useMemo(() => {
    const c = selectedCategory.trim()
    if (!c) return catalogServices
    return catalogServices.filter((s) => (s.expert.category || "").trim() === c)
  }, [catalogServices, selectedCategory])

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    for (const s of catalogServices) {
      const cat = (s.expert.category || "").trim()
      if (cat) set.add(cat)
    }
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b))
    if (selectedCategory && !sorted.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())) {
      sorted.unshift(selectedCategory)
    }
    return sorted
  }, [catalogServices, selectedCategory])

  const categorySelectValue = useMemo(() => {
    if (!selectedCategory) return ALL_CATEGORIES_VALUE
    const q = selectedCategory.toLowerCase()
    for (const c of categoryOptions) {
      if (c.toLowerCase() === q) return c
    }
    return selectedCategory
  }, [selectedCategory, categoryOptions])

  const onCategoryFilterChange = useCallback(
    (value: string) => {
      if (value === ALL_CATEGORIES_VALUE) {
        router.replace("/experts")
        return
      }
      router.replace(`/experts?category=${encodeURIComponent(value)}`)
    },
    [router],
  )

  const { title: shellTitle, subtitle: shellSubtitle } = useMemo(
    () => hubServiceLineShellLabels("experts", expertsLine, t, t("hub.expertsTitle")),
    [expertsLine, t],
  )
  const title = shellTitle
  const subtitle = shellSubtitle ?? t("hub.expertsSubtitle")

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
    <HubLinePageShell title={title} subtitle={subtitle} backToHubAriaLabel={t("hub.backToHub")} backHref="/hub">
      <div className="space-y-12 sm:space-y-14">
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              {t("hub.expertsFeaturedHeading", { defaultValue: "Featured" })}
            </h2>
            {profiles.length > 0 ? (
              <Link
                href={EXPERTS_BROWSE_PATH}
                prefetch
                className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-orange-600 transition hover:text-orange-700"
              >
                {t("hub.expertsSeeAll", { defaultValue: "See all" })}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </div>

          {loadingProfiles && profiles.length === 0 ? (
            <div className="flex gap-3 overflow-hidden pb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-36 w-28 shrink-0 rounded-2xl bg-muted sm:h-40 sm:w-32" />
              ))}
            </div>
          ) : featuredPreview.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("hub.expertsFeaturedEmpty", { defaultValue: "No experts yet — check back soon." })}
            </p>
          ) : (
            <div className="-mx-1 flex gap-3 overflow-x-auto overscroll-x-contain pb-2 pt-0.5 sm:gap-4">
              {featuredPreview.map((ex) => (
                <HubExpertCatalogFeaturedChip key={ex.id} expert={ex} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex min-w-0 flex-nowrap items-center justify-between gap-2 sm:gap-3">
            <h2 className="min-w-0 flex-1 truncate text-lg font-semibold text-foreground sm:text-xl">
              {t("hub.expertsServicesHeading", { defaultValue: "Services" })}
            </h2>
            {categoryOptions.length > 0 ? (
              <div className="shrink-0 basis-44 sm:basis-56 w-44 sm:w-56 min-w-0">
                <Select value={categorySelectValue} onValueChange={onCategoryFilterChange}>
                  <SelectTrigger className="max-w-full" aria-label={t("hub.categoryFilterAria")}>
                    <SelectValue placeholder={t("hub.allCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CATEGORIES_VALUE}>{t("hub.allCategories")}</SelectItem>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          {loadingCatalog && catalogServices.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 min-h-[11rem] rounded-2xl bg-muted sm:h-48" />
              ))}
            </div>
          ) : catalogServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("hub.expertsServicesEmpty", { defaultValue: "No services listed yet." })}</p>
          ) : displayedServices.length === 0 ? (
            <div className="space-y-3 py-10 text-center text-sm text-muted-foreground">
              <p>{t("hub.expertsServicesNoneInCategory", { defaultValue: "No services in this category." })}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => onCategoryFilterChange(ALL_CATEGORIES_VALUE)}>
                {t("hub.allCategories")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {displayedServices.map((s) => (
                <div key={s.id} className="h-full min-w-0">
                  <HubExpertServiceCatalogCard service={s} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </HubLinePageShell>
  )
}

export default function ExpertsDiscoveryPage() {
  return <ExpertsDiscoveryInner />
}
