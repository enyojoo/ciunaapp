"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { HubLinePageShell } from "@/components/hub/hub-line-page-shell"
import {
  ExpertServicePriceRow,
  HubExpertServiceCatalogCard,
  type ExpertCatalogService,
} from "@/components/hub/hub-expert-service-catalog-card"
import { HubExpertChipLight } from "@/components/hub/hub-expert-chip-light"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { stashRedirectAfterLogin } from "@/lib/auth-login-redirect"
import { apiFetch } from "@/lib/api-client"
import {
  readStaleExpertCatalogServicesListCache,
  writeExpertCatalogServicesListCache,
} from "@/lib/expert-profile-client-cache"
import { expertsBookPath, expertsProfilePath } from "@/lib/experts-public-paths"

export default function ExpertServiceDetailPage() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { user } = useAuth()
  const serviceId = String(useParams()?.serviceId || "").trim()
  const [services, setServices] = useState<ExpertCatalogService[]>(() => readStaleExpertCatalogServicesListCache() || [])
  const [loaded, setLoaded] = useState(services.length > 0)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await apiFetch("/api/expert/catalog-services", { cache: "no-store" })
        if (!res.ok) throw new Error("catalog")
        const data = await res.json()
        const list = (data.services || []) as ExpertCatalogService[]
        if (!cancelled) {
          setServices(list)
          writeExpertCatalogServicesListCache(list)
        }
      } catch {
        if (!cancelled && services.length === 0) setServices([])
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId])

  const service = useMemo(() => services.find((s) => s.id === serviceId) || null, [services, serviceId])
  const more = useMemo(
    () => (service ? services.filter((s) => s.id !== service.id && s.expert.id === service.expert.id) : []),
    [services, service],
  )

  const bookHref = service ? expertsBookPath(service.expert, { service: service.id }) : "/experts"

  return (
    <HubLinePageShell
      title={service?.title || t("hub.hub")}
      subtitle={service?.short_description || null}
      backToHubAriaLabel={t("hub.backToHub")}
    >
      {!loaded && !service ? (
        <div className="mx-auto max-w-2xl animate-pulse space-y-3 py-8">
          <div className="h-8 rounded-lg bg-muted" />
          <div className="h-24 rounded-xl bg-muted" />
        </div>
      ) : !service ? (
        <p className="text-sm text-muted-foreground">{t("hub.serviceUnavailable")}</p>
      ) : (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{service.title}</h1>
            <HubExpertChipLight
              expert={service.expert}
              className="max-w-full"
              verifiedAriaLabel={t("hub.expertVerified", { defaultValue: "Verified expert" })}
            />
            {service.short_description ? (
              <p className="text-sm leading-relaxed text-foreground">{service.short_description}</p>
            ) : null}
            <ExpertServicePriceRow service={service} />
            <Button asChild className="h-12 w-full rounded-xl text-sm font-semibold">
              <Link
                href={user ? bookHref : "/auth/login"}
                prefetch={Boolean(user)}
                onClick={
                  user
                    ? undefined
                    : (e) => {
                        e.preventDefault()
                        stashRedirectAfterLogin(bookHref)
                        router.push("/auth/login")
                      }
                }
              >
                {t("experts.profile.bookSession")}
              </Link>
            </Button>
            <Link href={expertsProfilePath(service.expert)} className="block text-center text-sm font-medium text-primary">
              {service.expert.display_name}
            </Link>
          </div>
          {more.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                {t("hub.cart.moreFromVendor", { defaultValue: "More from {{vendor}}", vendor: service.expert.display_name })}
              </h2>
              <ul className="grid grid-cols-2 gap-3 sm:gap-4">
                {more.map((s) => (
                  <li key={s.id}>
                    <HubExpertServiceCatalogCard service={s} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </HubLinePageShell>
  )
}
