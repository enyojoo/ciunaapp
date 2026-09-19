"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HubExpertChipLight, type HubExpertChipSummary } from "@/components/hub/hub-expert-chip-light"
import { useAuth } from "@/lib/auth-context"
import { stashRedirectAfterLogin } from "@/lib/auth-login-redirect"
import { expertsBookPath, expertsProfilePath, expertsServicePath } from "@/lib/experts-public-paths"
import { cn } from "@/lib/utils"
import { amountPrefixClass, amountValueClass, formatCardPrice } from "@/lib/hub-catalog-utils"

export type ExpertCatalogService = {
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
  expert: HubExpertChipSummary
}

const serviceCardClass =
  "flex h-full flex-col rounded-2xl border border-gray-200 bg-white py-0 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:border-orange-300/70 motion-safe:hover:shadow-[0_18px_36px_rgba(15,23,42,0.14)] dark:border-border dark:bg-card"

type ExpertServicePriceFields = Pick<
  ExpertCatalogService,
  "pricing_type" | "hourly_rate" | "hourly_currency" | "fixed_amount" | "fixed_currency" | "package_label"
>

export function ExpertServicePriceRow({ service: s }: { service: ExpertServicePriceFields }) {
  const { t } = useTranslation("app")
  if (s.pricing_type === "quote") {
    return (
      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
        <span className={amountPrefixClass}>{t("experts.bookingWizard.priceQuote")}</span>
      </div>
    )
  }
  if (s.pricing_type === "hourly" && s.hourly_rate != null) {
    return (
      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
        <span className={amountPrefixClass}>{t("experts.profile.priceFrom")}</span>
        <span className={amountValueClass}>{formatCardPrice(Number(s.hourly_rate), s.hourly_currency)}</span>
        <span className={amountPrefixClass}>/ hr</span>
      </div>
    )
  }
  if (s.pricing_type === "fixed" && s.fixed_amount != null) {
    return (
      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
        <span className={amountValueClass}>{formatCardPrice(Number(s.fixed_amount), s.fixed_currency)}</span>
        {s.package_label ? <span className={amountPrefixClass}>— {s.package_label}</span> : null}
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
      <span className={amountPrefixClass}>{t("experts.bookingWizard.priceDash")}</span>
    </div>
  )
}

export function HubExpertServiceCatalogCard({ service: s }: { service: ExpertCatalogService }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { user } = useAuth()
  const profileHref = expertsProfilePath(s.expert)
  const detailHref = expertsServicePath(s.id)
  const bookHref = expertsBookPath(s.expert, { service: s.id })

  const onGuestBookNav = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    stashRedirectAfterLogin(bookHref)
    router.push("/auth/login")
  }

  return (
    <Card className={cn(serviceCardClass, "h-full")}>
      <CardContent className="flex min-h-[11rem] flex-1 flex-col gap-2.5 p-3 sm:min-h-[12rem] sm:gap-3 sm:p-5">
        <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
          <Link href={detailHref} prefetch className="block min-w-0">
            <p className="truncate text-base font-semibold leading-snug tracking-tight text-gray-900 transition-colors hover:text-orange-700 dark:text-foreground dark:hover:text-orange-300 sm:text-lg">
              {s.title}
            </p>
          </Link>
          <div className="pt-0.5">
            <HubExpertChipLight
              expert={s.expert}
              className="max-w-full"
              verifiedAriaLabel={t("hub.expertVerified", { defaultValue: "Verified expert" })}
            />
          </div>
        </div>
        <ExpertServicePriceRow service={s} />
        <div className="mt-auto flex flex-col gap-2 pt-0.5">
          <Button asChild size="sm" className="h-9 w-full rounded-xl text-xs font-semibold sm:h-10 sm:text-sm">
            <Link href={user ? bookHref : "/auth/login"} prefetch={Boolean(user)} onClick={user ? undefined : onGuestBookNav}>
              {t("experts.profile.bookSession")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
