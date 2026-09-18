"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"
import { CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import { stashRedirectAfterLogin } from "@/lib/auth-login-redirect"
import {
  appendExpertsBookEntryFrom,
  expertsBookPath,
  expertsBookServicePath,
  expertsProfilePath,
  EXPERTS_BOOK_FROM_PROFILE,
  EXPERTS_BOOK_FROM_QUERY,
  EXPERTS_CATALOG_PATH,
} from "@/lib/experts-public-paths"
import {
  isExpertProfileDetailCacheFresh,
  readStaleExpertProfileDetailCache,
  writeExpertProfileDetailCache,
} from "@/lib/expert-profile-client-cache"
import { AppPageHeader } from "@/components/layout/app-page-header"
import { HubExpertChipLight } from "@/components/hub/hub-expert-chip-light"
import { ExpertServicePriceRow } from "@/components/hub/hub-expert-service-catalog-card"
import { ExpertSessionCheckoutPanel } from "@/components/hub/expert-session-checkout-panel"
import { HubLinePageShell } from "@/components/hub/hub-line-page-shell"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ExpertProfile = {
  id: string
  slug?: string | null
  display_name: string
  headline: string | null
  image_url?: string | null
  service_area?: string | null
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

type SlotRow = { id: string; slot_start: string; slot_end: string }

type Preflight = {
  slot: { id: string; slot_start: string; slot_end: string }
  service: ExpertService
  profile: ExpertProfile
}

function slotDayLocalKey(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd")
}

export function ExpertBookingWizard() {
  const { t } = useTranslation("app")
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slugOrId = String(params?.slug || "").trim()
  const serviceIdFromPath = String((params as { serviceId?: string }).serviceId ?? "").trim()
  const slotFromQuery = (searchParams.get("slot") || "").trim()
  const serviceFromQuery = (searchParams.get("service") || "").trim()
  const entryFromProfile = searchParams.get(EXPERTS_BOOK_FROM_QUERY) === EXPERTS_BOOK_FROM_PROFILE

  const resolvedServiceId = serviceIdFromPath || serviceFromQuery

  const { user, loading: authLoading } = useAuth()
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(() => (serviceIdFromPath ? 2 : 1))
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ExpertProfile | null>(null)
  const [services, setServices] = useState<ExpertService[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [slots, setSlots] = useState<SlotRow[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deepLinkError, setDeepLinkError] = useState(false)
  const [deepLinkPending, setDeepLinkPending] = useState(false)

  const [preflight, setPreflight] = useState<Preflight | null>(null)
  const [contactEmail, setContactEmail] = useState("")
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const idempotencyKeyRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  )

  useEffect(() => {
    if (!slotFromQuery) {
      setDeepLinkError(false)
      setDeepLinkPending(false)
    }
  }, [slotFromQuery])

  const skipServiceStep = useMemo(() => {
    if (!resolvedServiceId || services.length === 0) return false
    return services.some((s) => s.id === resolvedServiceId)
  }, [resolvedServiceId, services])

  /** Service deep-linked (`/book/[serviceId]` or legacy `?service=`) → jump to date/time. */
  useLayoutEffect(() => {
    if (!resolvedServiceId || services.length === 0) return
    const match = services.find((s) => s.id === resolvedServiceId)
    if (!match) return
    setSelectedServiceId(match.id)
    setWizardStep(2)
  }, [resolvedServiceId, services])

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
    if (!user && !authLoading && typeof window !== "undefined") {
      stashRedirectAfterLogin(`${window.location.pathname}${window.location.search}`)
      router.replace("/auth/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!slugOrId || !user || authLoading) return
    if (isExpertProfileDetailCacheFresh(slugOrId)) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetchWithAuth(`/api/expert/profiles/${encodeURIComponent(slugOrId)}`, { cache: "no-store" })
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
  }, [slugOrId, user, authLoading])

  /** Deep link `?slot=` → load confirmation payload and open checkout on same route (send-style). */
  useEffect(() => {
    if (!user || !slotFromQuery || !slugOrId) return
    let cancelled = false
    setDeepLinkPending(true)
    ;(async () => {
      try {
        const res = await fetchWithAuth(`/api/expert/slots/${encodeURIComponent(slotFromQuery)}`, { cache: "no-store" })
        if (!res.ok) {
          if (!cancelled) setDeepLinkError(true)
          return
        }
        const data = (await res.json()) as Preflight
        if (cancelled) return
        setPreflight(data)
        setSelectedServiceId(data.service.id)
        setSelectedSlotId(data.slot.id)
        setWizardStep(3)
        router.replace(
          appendExpertsBookEntryFrom(expertsBookServicePath(data.profile, data.service.id), entryFromProfile),
        )
      } catch {
        if (!cancelled) setDeepLinkError(true)
      } finally {
        if (!cancelled) setDeepLinkPending(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, slotFromQuery, slugOrId, router, entryFromProfile])

  useEffect(() => {
    if (user?.email) setContactEmail(user.email)
  }, [user?.email])

  const loadSlots = useCallback(async (serviceId: string) => {
    setLoadingSlots(true)
    setSlots([])
    setSelectedSlotId(null)
    try {
      const res = await fetchWithAuth(`/api/expert/services/${encodeURIComponent(serviceId)}/slots`, { cache: "no-store" })
      if (!res.ok) throw new Error("slots")
      const data = await res.json()
      setSlots((data.slots || []) as SlotRow[])
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  useEffect(() => {
    if (wizardStep !== 2 || !selectedServiceId) return
    void loadSlots(selectedServiceId)
  }, [wizardStep, selectedServiceId, loadSlots])

  const slotDayKeys = useMemo(() => {
    const s = new Set<string>()
    for (const sl of slots) s.add(slotDayLocalKey(sl.slot_start))
    return s
  }, [slots])

  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDay) return []
    const key = format(selectedDay, "yyyy-MM-dd")
    return slots.filter((sl) => slotDayLocalKey(sl.slot_start) === key)
  }, [slots, selectedDay])

  const goConfirm = async () => {
    if (!selectedServiceId || !selectedSlotId || !profile) return
    setSubmitError(null)
    const res = await fetchWithAuth(`/api/expert/slots/${encodeURIComponent(selectedSlotId)}`, { cache: "no-store" })
    if (!res.ok) {
      setSubmitError(t("experts.bookingWizard.slotTaken"))
      return
    }
    const data = (await res.json()) as Preflight
    setPreflight(data)
    setWizardStep(3)
  }

  const handleQuoteBooking = useCallback(
    async ({ message }: { message: string }) => {
      if (!preflight?.slot.id || !profile) throw new Error(t("experts.booking.failed"))
      const res = await fetchWithAuth("/api/expert/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expert_service_slot_id: preflight.slot.id,
          message: message || null,
        }),
      })
      if (res.status === 409) throw new Error(t("experts.bookingWizard.slotTaken"))
      if (!res.ok) throw new Error(t("experts.booking.failed"))
      setBookingSuccess(true)
      router.replace(
        appendExpertsBookEntryFrom(expertsBookServicePath(profile, preflight.service.id), entryFromProfile),
      )
    },
    [preflight, profile, router, t, entryFromProfile],
  )

  if (!user && authLoading) {
    return (
      <HubLinePageShell
        title={t("experts.bookingWizard.loadingTitle", { defaultValue: "Booking" })}
        subtitle={null}
        backToHubAriaLabel={t("hub.backToExperts")}
        backHref={EXPERTS_CATALOG_PATH}
        heroLoading
        showHeroClose={false}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-36 max-w-3xl rounded-2xl bg-muted" />
        </div>
      </HubLinePageShell>
    )
  }

  if (!user) {
    return null
  }

  if (!slugOrId) {
    return null
  }

  if (loading || deepLinkPending) {
    return (
      <HubLinePageShell
        title={t("experts.bookingWizard.loadingTitle", { defaultValue: "Booking" })}
        subtitle={null}
        backToHubAriaLabel={t("hub.backToExperts")}
        backHref={EXPERTS_CATALOG_PATH}
        heroLoading
        showHeroClose
      >
        <div className="animate-pulse space-y-4">
          <div className="h-36 max-w-3xl rounded-2xl bg-muted" />
        </div>
      </HubLinePageShell>
    )
  }

  if (deepLinkError) {
    return (
      <HubLinePageShell
        title={t("experts.bookingWizard.slotUnavailable")}
        subtitle={null}
        backToHubAriaLabel={t("hub.backToExperts")}
        backHref={EXPERTS_CATALOG_PATH}
        showHeroClose
      >
        <div className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row">
          {profile ? (
            <Button asChild variant="default" className="rounded-xl">
              <Link href={expertsBookPath(profile)} prefetch>{t("experts.bookingWizard.tryAgain")}</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={EXPERTS_CATALOG_PATH} prefetch>{t("hub.expertsAll")}</Link>
          </Button>
        </div>
      </HubLinePageShell>
    )
  }

  if (!profile) {
    return (
      <HubLinePageShell
        title={t("hub.expertNotFound")}
        subtitle={null}
        backToHubAriaLabel={t("hub.backToExperts")}
        backHref={EXPERTS_CATALOG_PATH}
        showHeroClose
      >
        <div className="mx-auto max-w-lg">
          <Button asChild variant="outline">
            <Link href={EXPERTS_CATALOG_PATH} prefetch>{t("hub.expertsAll")}</Link>
          </Button>
        </div>
      </HubLinePageShell>
    )
  }

  const p = profile
  const bookExitFallback = entryFromProfile ? expertsProfilePath(p) : EXPERTS_CATALOG_PATH
  const selectedService = selectedServiceId ? services.find((s) => s.id === selectedServiceId) ?? null : null
  const serviceTitleForHero =
    selectedService?.title ??
    (resolvedServiceId.trim() ? services.find((s) => s.id === resolvedServiceId)?.title : undefined)
  const heroTitle =
    serviceTitleForHero != null
      ? t("experts.bookingWizard.heroBookService", { title: serviceTitleForHero })
      : t("experts.bookingWizard.chooseService")

  const heroBelowTitle = (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span className="shrink-0 text-[11px] font-medium sm:text-xs text-orange-100/95">
        {t("experts.bookingWizard.providedBy")}
      </span>
      <div className="min-w-0 [&_a]:text-orange-50 [&_a:hover]:text-white [&_span]:text-orange-50 [&_span:hover]:text-white">
        <HubExpertChipLight
          expert={{
            id: p.id,
            slug: p.slug,
            display_name: p.display_name,
            image_url: p.image_url ?? null,
            is_verified: false,
          }}
          verifiedAriaLabel={t("hub.expertVerified", { defaultValue: "Verified expert" })}
          className="text-orange-50 hover:text-white"
        />
      </div>
    </div>
  )

  if (bookingSuccess && preflight) {
    const svc = preflight.service
    const slot = preflight.slot
    const ep = preflight.profile
    return (
      <div className="min-w-0 px-4 pb-10 pt-2 sm:px-6">
        <AppPageHeader title={t("experts.bookingWizard.successTitle")} backHref={bookExitFallback} />
        <div className="mx-auto mt-6 max-w-lg space-y-6 text-center">
          <CheckCircle2 className="mx-auto size-14 text-green-600 dark:text-green-500" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("experts.bookingWizard.successBody", { name: ep.display_name })}</p>
          <Card className="rounded-2xl border-border text-left">
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="font-semibold text-foreground">{svc.title}</p>
              <p className="text-muted-foreground">
                {new Date(slot.slot_start).toLocaleString()} — {new Date(slot.slot_end).toLocaleString()}
              </p>
              <ExpertServicePriceRow service={svc} />
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            {t("experts.bookingWizard.confirmationEmail", { email: contactEmail || user?.email || "" })}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="rounded-xl">
              <Link href={expertsProfilePath(ep)} prefetch>{t("experts.bookingWizard.bookAnother")}</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-xl">
              <Link href={EXPERTS_CATALOG_PATH} prefetch>{t("hub.expertsAll")}</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (wizardStep === 3 && preflight) {
    const svc = preflight.service
    const checkoutProfile = preflight.profile
    const slotPickerHref = appendExpertsBookEntryFrom(
      expertsBookServicePath(checkoutProfile, svc.id),
      entryFromProfile,
    )
    return (
      <div className="min-w-0 space-y-8 px-4 pb-10 pt-2 sm:px-6">
        <AppPageHeader
          title={t("hub.checkout.title")}
          backHref={slotPickerHref}
          onBack={() => {
            setWizardStep(2)
            setPreflight(null)
            setSelectedSlotId(null)
            setSubmitError(null)
            router.replace(slotPickerHref)
          }}
        />

        <ExpertSessionCheckoutPanel
          preflight={preflight}
          idempotencyKeyRef={idempotencyKeyRef}
          onQuoteBooking={handleQuoteBooking}
        />
      </div>
    )
  }

  return (
    <HubLinePageShell
      title={heroTitle}
      subtitle={null}
      heroBelowTitle={heroBelowTitle}
      backToHubAriaLabel={t("hub.backToExperts")}
      backHref={bookExitFallback}
    >
      <div className="mx-auto max-w-3xl">
        {wizardStep === 1 && !skipServiceStep ? (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">{t("experts.bookingWizard.chooseService")}</h2>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("experts.bookingWizard.noServices")}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedServiceId(s.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition hover:border-orange-300/70",
                      selectedServiceId === s.id ? "border-orange-400 ring-1 ring-orange-400/40" : "border-border bg-card",
                    )}
                  >
                    <p className="font-semibold text-foreground">{s.title}</p>
                    <p className="mt-1">
                      <ExpertServicePriceRow service={s} />
                    </p>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button
                className="rounded-xl"
                disabled={!selectedServiceId}
                onClick={() => {
                  if (!selectedServiceId || !profile) return
                  router.replace(appendExpertsBookEntryFrom(expertsBookServicePath(profile, selectedServiceId), entryFromProfile))
                  setWizardStep(2)
                  setSelectedDay(undefined)
                  setSelectedSlotId(null)
                }}
              >
                {t("experts.bookingWizard.continue")}
              </Button>
            </div>
          </div>
        ) : null}

        {wizardStep === 2 ? (
          <div className="space-y-6">
            {(selectedService?.short_description || "").trim() ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{selectedService.short_description}</p>
            ) : null}
            <h2 className="text-base font-semibold text-foreground">{t("experts.bookingWizard.chooseTime")}</h2>
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="shrink-0">
                <Calendar
                  mode="single"
                  selected={selectedDay}
                  onSelect={(d) => {
                    setSelectedDay(d)
                    setSelectedSlotId(null)
                  }}
                  disabled={(date) => !slotDayKeys.has(format(date, "yyyy-MM-dd"))}
                  modifiers={{
                    hasSlots: (date) => slotDayKeys.has(format(date, "yyyy-MM-dd")),
                  }}
                  modifiersClassNames={{
                    hasSlots: "font-semibold text-orange-700 dark:text-orange-300",
                  }}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {selectedDay ? format(selectedDay, "EEEE, MMM d") : t("experts.bookingWizard.pickDay")}
                </p>
                {loadingSlots ? (
                  <p className="text-sm text-muted-foreground">{t("experts.bookingWizard.loadingSlots")}</p>
                ) : !selectedDay ? (
                  <p className="text-sm text-muted-foreground">{t("experts.bookingWizard.selectDayHint")}</p>
                ) : slotsForSelectedDay.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("experts.bookingWizard.noSlotsDay")}</p>
                ) : (
                  <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
                    {slotsForSelectedDay.map((sl) => (
                      <button
                        key={sl.id}
                        type="button"
                        onClick={() => setSelectedSlotId(sl.id)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-left text-sm transition hover:border-orange-300/70",
                          selectedSlotId === sl.id ? "border-orange-400 ring-1 ring-orange-400/40" : "border-border bg-card",
                        )}
                      >
                        {new Date(sl.slot_start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} —{" "}
                        {new Date(sl.slot_end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            <div className="flex flex-wrap justify-between gap-3 pt-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setSubmitError(null)
                  if (skipServiceStep) {
                    router.push(expertsProfilePath(p))
                    return
                  }
                  setWizardStep(1)
                  setSelectedSlotId(null)
                }}
              >
                {t("experts.bookingWizard.back")}
              </Button>
              <Button className="rounded-xl" disabled={!selectedSlotId} onClick={() => void goConfirm()}>
                {t("experts.bookingWizard.continue")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </HubLinePageShell>
  )
}
