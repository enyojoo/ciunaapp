"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth-context"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { HubShellHeader } from "@/components/hub/hub-shell-header"
import { HubServiceLineTiles } from "@/components/hub/hub-service-line-tiles"
import type { HubServiceLineRow } from "@/lib/hub-service-line-types"
import {
  hubPublicHubJsonCacheUserId,
  isHubServiceLinesCacheFresh,
  readStaleHubServiceLinesCache,
  scheduleHubServiceLinesStaleWhileRevalidate,
  writeHubServiceLinesCache,
} from "@/lib/hub-client-cache"

const SERVICE_LINES_CACHE_USER = hubPublicHubJsonCacheUserId()

export default function HubHomePage() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [lines, setLines] = useState<HubServiceLineRow[]>([])
  const [loading, setLoading] = useState(true)

  const hubHeroTitle = t("hub.heroTitle")
  const hubHeroBody = t("hub.heroBody")

  useLayoutEffect(() => {
    const stale = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
    setLines(stale ?? [])
    setLoading(stale === null)
  }, [])

  useEffect(() => {
    if (!user) {
      if (!authLoading) router.push("/auth/login")
      return
    }
    if (!user.id) return

    if (isHubServiceLinesCacheFresh(SERVICE_LINES_CACHE_USER)) {
      const s = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
      if (s) setLines(s)
      setLoading(false)
      scheduleHubServiceLinesStaleWhileRevalidate(SERVICE_LINES_CACHE_USER, async () => {
        const res = await fetchWithAuth("/api/hub/service-lines", { cache: "no-store" })
        if (!res.ok) return null
        const data = await res.json()
        return (data.serviceLines || []) as HubServiceLineRow[]
      }, setLines)
      return
    }

    const load = async (silent: boolean) => {
      try {
        const res = await fetchWithAuth("/api/hub/service-lines", { cache: "no-store" })
        if (!res.ok) throw new Error("load")
        const data = await res.json()
        const next = (data.serviceLines || []) as HubServiceLineRow[]
        setLines(next)
        writeHubServiceLinesCache(SERVICE_LINES_CACHE_USER, next)
      } catch {
        if (!silent) setLines([])
      } finally {
        if (!silent) setLoading(false)
      }
    }

    const stale = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
    void load(stale !== null)
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user?.id) return
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void (async () => {
          try {
            const res = await fetchWithAuth("/api/hub/service-lines", { cache: "no-store" })
            if (!res.ok) return
            const data = await res.json()
            const next = (data.serviceLines || []) as HubServiceLineRow[]
            setLines(next)
            writeHubServiceLinesCache(SERVICE_LINES_CACHE_USER, next)
          } catch {
            /* keep cached rows */
          }
        })()
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [user?.id])

  if (!user) {
    return (
      <div className="min-w-0 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-4 animate-pulse">
          <div className="h-12 rounded-lg bg-muted" />
          <div className="h-32 rounded-2xl bg-muted" />
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[6.75rem] rounded-lg bg-muted sm:h-[8.5rem] sm:rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <div className="mx-auto w-full max-w-5xl space-y-6 pb-5 sm:pb-6 sm:pt-5">
        <HubShellHeader />

        <div className="space-y-6 px-4 sm:px-6">
          <section className="rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 p-5 text-center text-white shadow-sm sm:p-6">
            <div className="mx-auto space-y-1.5 sm:space-y-2">
              <h1 className="text-balance text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
                {hubHeroTitle}
              </h1>
              <p className="mx-auto max-w-xs text-sm/6 text-orange-50 sm:max-w-sm sm:text-base/7">
                {hubHeroBody}
              </p>
            </div>
          </section>

          <section>
            {loading ? (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-[6.75rem] rounded-lg bg-muted sm:h-[8.5rem] sm:rounded-xl" />
                ))}
              </div>
            ) : lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("hub.serviceUnavailable")}</p>
            ) : (
              <HubServiceLineTiles lines={lines} />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
