"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, HelpCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth-context"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import type { HubServiceLineRow } from "@/lib/hub-service-line-types"
import {
  hubPublicHubJsonCacheUserId,
  isHubServiceLinesCacheFresh,
  readStaleHubServiceLinesCache,
  scheduleHubServiceLinesStaleWhileRevalidate,
  writeHubServiceLinesCache,
} from "@/lib/hub-client-cache"
import { hubServiceLineShellLabels } from "@/lib/hub-service-line-i18n"

const SERVICE_LINES_CACHE_USER = hubPublicHubJsonCacheUserId()
import { HubLinePageShell } from "@/components/hub/hub-line-page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type AssistantKind = "pickup_order" | "buy_something" | "run_errands"

const KINDS: { id: AssistantKind; titleKey: string; descKey: string }[] = [
  { id: "pickup_order", titleKey: "assistant.kind.pickupTitle", descKey: "assistant.kind.pickupDesc" },
  { id: "buy_something", titleKey: "assistant.kind.buyTitle", descKey: "assistant.kind.buyDesc" },
  { id: "run_errands", titleKey: "assistant.kind.errandTitle", descKey: "assistant.kind.errandDesc" },
]

export default function AssistantPage() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [lines, setLines] = useState<HubServiceLineRow[]>([])
  const [linesLoaded, setLinesLoaded] = useState(false)
  const [kind, setKind] = useState<AssistantKind | null>(null)
  const [pickupNotes, setPickupNotes] = useState("")
  const [buyNotes, setBuyNotes] = useState("")
  const [dropoff, setDropoff] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const assistantLine = useMemo(() => lines.find((l) => l.slug === "assistant") ?? null, [lines])

  useLayoutEffect(() => {
    const stale = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
    if (stale !== null) {
      setLines(stale)
      setLinesLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      if (!authLoading) router.push("/auth/login")
      return
    }

    if (isHubServiceLinesCacheFresh(SERVICE_LINES_CACHE_USER)) {
      const s = readStaleHubServiceLinesCache(SERVICE_LINES_CACHE_USER)
      if (s) setLines(s)
      setLinesLoaded(true)
      scheduleHubServiceLinesStaleWhileRevalidate(SERVICE_LINES_CACHE_USER, async () => {
        const res = await fetchWithAuth("/api/hub/service-lines", { cache: "no-store" })
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
        const res = await fetchWithAuth("/api/hub/service-lines", { cache: "no-store" })
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
  }, [user, authLoading, router])

  const { title: heroTitle, subtitle: heroSubtitle } = useMemo(
    () => hubServiceLineShellLabels("assistant", assistantLine, t, t("assistant.title")),
    [assistantLine, t],
  )

  const nextLabel = useMemo(() => {
    if (!kind) return t("assistant.cta.pickKind")
    if (!pickupNotes.trim() && (kind === "pickup_order" || kind === "run_errands")) return t("assistant.cta.pickupDetails")
    if (kind === "buy_something" && !buyNotes.trim()) return t("assistant.cta.buyDetails")
    if (!dropoff.trim()) return t("assistant.cta.dropoff")
    if (!vehicle.trim()) return t("assistant.cta.vehicle")
    return t("assistant.cta.submit")
  }, [kind, pickupNotes, buyNotes, dropoff, vehicle, t])

  const canSubmit = Boolean(
    kind &&
      dropoff.trim() &&
      vehicle.trim() &&
      (kind === "buy_something" ? buyNotes.trim() : pickupNotes.trim()),
  )

  const submit = useCallback(async () => {
    if (!kind || !canSubmit) return
    setSubmitting(true)
    try {
      const payload = {
        pickup_or_errand: pickupNotes,
        buy_instructions: buyNotes,
        dropoff_address: dropoff,
        vehicle_preference: vehicle,
      }
      const res = await fetchWithAuth("/api/assistant/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: kind,
          status: "submitted",
          payload,
        }),
      })
      if (!res.ok) throw new Error("submit")
      router.replace("/activities")
    } catch {
      window.alert(t("assistant.submitFailed"))
    } finally {
      setSubmitting(false)
    }
  }, [kind, canSubmit, pickupNotes, buyNotes, dropoff, vehicle, router, t])

  if (!user) {
    return (
      <div className="min-w-0 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-5xl animate-pulse space-y-4">
          <div className="h-40 rounded-2xl bg-muted" />
        </div>
      </div>
    )
  }

  if (linesLoaded && assistantLine && !assistantLine.is_enabled) {
    return (
      <div className="min-w-0 pb-28">
        <HubLinePageShell
          title={t("hub.unavailableTitle")}
          subtitle={null}
          backToHubAriaLabel={t("hub.backToHub")}
        >
          <p className="text-center text-sm text-muted-foreground">{t("hub.serviceUnavailable")}</p>
        </HubLinePageShell>
      </div>
    )
  }

  return (
    <div className="min-w-0 pb-28">
      <HubLinePageShell title={heroTitle} subtitle={heroSubtitle ?? t("assistant.intro")} backToHubAriaLabel={t("hub.backToHub")}>
        <div className="mx-auto w-full max-w-lg space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">{t("assistant.section.serviceType")}</h2>
              <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-full" aria-label={t("assistant.help")}>
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
            <div className="grid gap-3">
              {KINDS.map((k) => {
                const selected = kind === k.id
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    className={cn(
                      "min-h-[44px] rounded-2xl border p-4 text-left transition-colors",
                      selected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{t(k.titleKey)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t(k.descKey)}</p>
                      </div>
                      <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold">{t("assistant.section.details")}</h2>
            <Card className="rounded-2xl border-border">
              <CardContent className="space-y-4 p-4">
                {kind === "buy_something" ? (
                  <div className="space-y-2">
                    <Label htmlFor="buy">{t("assistant.field.whatToBuy")}</Label>
                    <Textarea
                      id="buy"
                      rows={3}
                      className="min-h-[44px] rounded-xl"
                      value={buyNotes}
                      onChange={(e) => setBuyNotes(e.target.value)}
                      placeholder={t("assistant.placeholder.buy")}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="pickup">{t("assistant.field.pickupInstructions")}</Label>
                    <Textarea
                      id="pickup"
                      rows={3}
                      className="min-h-[44px] rounded-xl"
                      value={pickupNotes}
                      onChange={(e) => setPickupNotes(e.target.value)}
                      placeholder={t("assistant.placeholder.pickup")}
                    />
                  </div>
                )}
                <button
                  type="button"
                  className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-3 text-left text-sm"
                >
                  <span className="text-muted-foreground">{t("assistant.field.courier")}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="space-y-2">
                  <Label htmlFor="vehicle">{t("assistant.field.vehicle")}</Label>
                  <Textarea
                    id="vehicle"
                    rows={2}
                    className="rounded-xl"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    placeholder={t("assistant.placeholder.vehicle")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dropoff">{t("assistant.field.dropoff")}</Label>
                  <Textarea
                    id="dropoff"
                    rows={2}
                    className="rounded-xl"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    placeholder={t("assistant.placeholder.dropoff")}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/support">{t("assistant.pill.howItWorks")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/support">{t("assistant.pill.restrictions")}</Link>
            </Button>
          </div>
        </div>
      </HubLinePageShell>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:left-56">
        <div className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{t("assistant.footer.total")}</p>
            <p className="text-sm font-semibold">{t("assistant.footer.fromQuote")}</p>
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:max-w-xs">
            <p className="text-xs text-muted-foreground">{t("assistant.footer.payment")}</p>
            <Button
              type="button"
              className="h-11 w-full rounded-xl text-base font-semibold"
              disabled={!canSubmit || submitting}
              onClick={() => void submit()}
            >
              {submitting ? t("assistant.submitting") : nextLabel}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
