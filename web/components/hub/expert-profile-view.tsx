"use client"

import { useCallback, useEffect, useLayoutEffect, useState, type MouseEvent } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { isUuidLike } from "@ciuna/shared"
import { useAuth } from "@/lib/auth-context"
import { stashRedirectAfterLogin } from "@/lib/auth-login-redirect"
import {
  appendExpertsBookEntryFrom,
  expertsBookServicePath,
  expertsProfilePath,
  expertsServicePath,
  EXPERTS_CATALOG_PATH,
} from "@/lib/experts-public-paths"
import { HubLinePageShell } from "@/components/hub/hub-line-page-shell"
import { ExpertServicePriceRow } from "@/components/hub/hub-expert-service-catalog-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  isExpertProfileDetailCacheFresh,
  readStaleExpertProfileDetailCache,
  writeExpertProfileDetailCache,
} from "@/lib/expert-profile-client-cache"
import { apiFetch } from "@/lib/api-client"

type ExpertProfile = {
  id: string
  slug?: string | null
  display_name: string
  headline: string | null
  bio: string | null
  category?: string | null
  image_url?: string | null
  service_area?: string | null
  meeting_hint?: string | null
}

type ExpertService = {
  id: string
  title: string
  short_description: string | null
  fulfillment_type?: string | null
  pricing_type: string
  hourly_rate: number | null
  hourly_currency: string | null
  fixed_amount: number | null
  fixed_currency: string | null
  package_label: string | null
  default_duration_minutes?: number | null
}

export function ExpertProfileView({ slugOrId }: { slugOrId: string }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const pathname = usePathname() || ""
  const { user } = useAuth()
  const [profile, setProfile] = useState<ExpertProfile | null>(null)
  const [services, setServices] = useState<ExpertService[]>([])
  const [loading, setLoading] = useState(true)

  const onGuestBookNav = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, bookUrl: string) => {
      e.preventDefault()
      stashRedirectAfterLogin(bookUrl)
      router.push("/auth/login")
    },
    [router],
  )

  useLayoutEffect(() => {
    if (!slugOrId) {
      setLoading(false)
      return
    }
    const stale = readStaleExpertProfileDetailCache(slugOrId)
    if (!stale) {
      setProfile(null)
      setServices([])
      setLoading(true)
      return
    }
    if (stale.notFound) {
      setProfile(null)
      setServices([])
      setLoading(false)
      return
    }
    setProfile((stale.profile || null) as ExpertProfile | null)
    setServices((stale.services || []) as ExpertService[])
    setLoading(false)
  }, [slugOrId])

  useEffect(() => {
    if (!slugOrId) {
      setLoading(false)
      return
    }
    if (isExpertProfileDetailCacheFresh(slugOrId)) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await apiFetch(`/api/expert/profiles/${encodeURIComponent(slugOrId)}`, { cache: "no-store" })
        if (res.status === 404) {
          writeExpertProfileDetailCache(slugOrId, { profile: null, services: [], notFound: true })
          if (!cancelled) {
            setProfile(null)
            setServices([])
          }
          return
        }
        if (!res.ok) throw new Error("load")
        const data = await res.json()
        const profile = (data.profile || null) as ExpertProfile | null
        const services = (data.services || []) as ExpertService[]
        writeExpertProfileDetailCache(slugOrId, {
          profile: profile as unknown as Record<string, unknown>,
          services: services as unknown as Record<string, unknown>[],
          notFound: false,
        })
        if (!cancelled) {
          setProfile(profile)
          setServices(services)
        }
      } catch {
        if (!cancelled) {
          setProfile(null)
          setServices([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slugOrId])

  /** Show `/experts/{slug}` in the address bar when the user opens `/experts/{uuid}` but the profile has a slug. */
  useEffect(() => {
    if (!profile) return
    const slug = typeof profile.slug === "string" ? profile.slug.trim() : ""
    if (!slug || !isUuidLike(slugOrId)) return
    const canonical = expertsProfilePath(profile)
    if (pathname !== canonical) router.replace(canonical)
  }, [profile, slugOrId, pathname, router])

  if (loading && !profile) {
    return (
      <HubLinePageShell
        title={t("experts.profile.loadingTitle", { defaultValue: "Expert" })}
        subtitle={null}
        backToHubAriaLabel={t("hub.backToHub")}
        backHref={EXPERTS_CATALOG_PATH}
        heroLoading
        showHeroClose={Boolean(user)}
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 max-w-[55%] rounded-md bg-muted" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </HubLinePageShell>
    )
  }

  if (profile === null) {
    return (
      <HubLinePageShell
        title={t("hub.expertNotFound")}
        subtitle={null}
        backToHubAriaLabel={t("hub.backToHub")}
        backHref={EXPERTS_CATALOG_PATH}
        showHeroClose={Boolean(user)}
      >
        <Button asChild variant="outline">
          <Link href={EXPERTS_CATALOG_PATH} prefetch>{t("hub.expertsAll")}</Link>
        </Button>
      </HubLinePageShell>
    )
  }

  const p = profile

  const heroSubtitle = (p.headline || "").trim() || null
  const heroLocation = (p.service_area || "").trim() || null
  const heroPhotoUrl = (p.image_url || "").trim() || null

  const serviceCardClass =
    "flex h-full flex-col rounded-2xl border border-gray-200 bg-white py-0 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:border-orange-300/70 motion-safe:hover:shadow-[0_18px_36px_rgba(15,23,42,0.14)] dark:border-border dark:bg-card"

  const bioBlock = (p.bio || "").trim()
  const meetingBlock = (p.meeting_hint || "").trim()
  const showBioFrame = Boolean(bioBlock || meetingBlock)

  return (
    <HubLinePageShell
      title={p.display_name}
      subtitle={heroSubtitle}
      backToHubAriaLabel={t("hub.backToHub")}
      backHref={EXPERTS_CATALOG_PATH}
      heroPhotoUrl={heroPhotoUrl || null}
      heroLocation={heroLocation}
      heroLoading={false}
      showHeroClose={Boolean(user)}
    >
      <div className="space-y-8">
        {showBioFrame ? (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            {bioBlock ? <p className="text-sm leading-relaxed text-foreground">{bioBlock}</p> : null}
            {meetingBlock ? (
              <p
                className={cn(
                  "text-sm leading-relaxed text-muted-foreground",
                  bioBlock ? "mt-4 border-t border-border pt-4" : "",
                )}
              >
                {meetingBlock}
              </p>
            ) : null}
          </div>
        ) : null}

        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">{t("experts.profile.servicesHeading")}</h2>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("experts.profile.noServices")}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {services.map((s) => (
                <li key={s.id} className="h-full min-w-0">
                  <Card className={cn(serviceCardClass, "h-full")}>
                    <CardContent className="flex min-h-[11rem] flex-1 flex-col gap-2.5 p-3 sm:min-h-[12rem] sm:gap-3 sm:p-5">
                      <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
                        <Link href={expertsServicePath(s.id)} prefetch className="block min-w-0">
                          <p className="truncate text-base font-semibold leading-snug tracking-tight text-gray-900 transition-colors hover:text-orange-700 dark:text-foreground dark:hover:text-orange-300 sm:text-lg">
                            {s.title}
                          </p>
                        </Link>
                        {s.default_duration_minutes != null && Number(s.default_duration_minutes) > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {t("experts.profile.typicalSession", { minutes: String(s.default_duration_minutes) })}
                          </p>
                        ) : null}
                      </div>
                      <ExpertServicePriceRow service={s} />
                      <div className="mt-auto flex flex-col gap-2 pt-0.5">
                        <Button asChild size="sm" className="h-9 w-full rounded-xl text-xs font-semibold sm:h-10 sm:text-sm">
                          <Link
                            href={
                              user
                                ? appendExpertsBookEntryFrom(expertsBookServicePath(p, s.id), true)
                                : "/auth/login"
                            }
                            prefetch={Boolean(user)}
                            onClick={
                              user
                                ? undefined
                                : (e) =>
                                    onGuestBookNav(
                                      e,
                                      appendExpertsBookEntryFrom(expertsBookServicePath(p, s.id), true),
                                    )
                            }
                          >
                            {t("experts.profile.bookSession")}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </HubLinePageShell>
  )
}
