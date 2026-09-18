"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BadgeCheck, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"

const heroCloseClassName = cn(
  "flex shrink-0 items-center justify-center rounded-full bg-black/15 text-white ring-1 ring-white/25 transition hover:bg-black/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80",
  "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 xl:h-11 xl:w-11",
)

function HeroCloseLink({
  backHref,
  backToHubAriaLabel,
  preferHistory,
}: {
  backHref: string
  backToHubAriaLabel: string
  preferHistory?: boolean
}) {
  const router = useRouter()
  if (preferHistory) {
    return (
      <button
        type="button"
        aria-label={backToHubAriaLabel}
        className={heroCloseClassName}
        onClick={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back()
          } else {
            router.push(backHref)
          }
        }}
      >
        <X
          className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-[1.125rem] md:w-[1.125rem] xl:h-5 xl:w-5"
          aria-hidden
        />
      </button>
    )
  }
  return (
    <Link href={backHref} prefetch aria-label={backToHubAriaLabel} className={heroCloseClassName}>
      <X
        className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-[1.125rem] md:w-[1.125rem] xl:h-5 xl:w-5"
        aria-hidden
      />
    </Link>
  )
}

export function HubLinePageShell({
  title,
  subtitle,
  children,
  backToHubAriaLabel,
  className,
  backHref = "/hub",
  heroClosePreferHistory = false,
  heroPhotoUrl,
  heroLocation,
  heroFulfillment,
  heroTitleVerified,
  heroTitleVerifiedAriaLabel,
  heroBelowTitle,
  heroLoading,
  showHeroClose = true,
  heroTrailingAction,
}: {
  title: string
  subtitle: string | null
  children: ReactNode
  /** Accessible label for the back link (e.g. translated “Back to Hub”). */
  backToHubAriaLabel: string
  className?: string
  /** Destination for the header close control (default `/hub`). */
  backHref?: string
  /** When true, close prefers browser history (same idea as AppPageHeader back); falls back to `backHref`. */
  heroClosePreferHistory?: boolean
  /** Optional square image in the hero (e.g. vendor storefront logo). */
  heroPhotoUrl?: string | null
  /** Optional location line inside the hero (below the title). */
  heroLocation?: string | null
  /** Optional fulfillment line (e.g. expert profile: “Fulfillment: …”). */
  heroFulfillment?: string | null
  /** When true, verified badge appears after the title (same order as product cards). */
  heroTitleVerified?: boolean
  /** `aria-label` for the verified badge (e.g. translated). */
  heroTitleVerifiedAriaLabel?: string
  /** Optional block directly under the hero title (e.g. expert booking “Provided by” row). */
  heroBelowTitle?: ReactNode
  /** Skeleton hero: no title/subtitle until vendor (or other) data is ready. */
  heroLoading?: boolean
  /** When false, hides the top-right hero close control (e.g. public vendor / expert storefront). */
  showHeroClose?: boolean
  /** Optional extra control in the top-right hero row, before the close button (e.g. a cart icon on Food/Mart). */
  heroTrailingAction?: ReactNode
}) {
  const locationLine = (heroLocation || "").trim()
  const fulfillmentLine = (heroFulfillment || "").trim()
  const photoUrl = heroPhotoUrl?.trim() || ""
  const vendorHeroLayout = Boolean(photoUrl)

  if (heroLoading) {
    return (
      <div className={cn("min-w-0", className)}>
        <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="overflow-hidden rounded-2xl border border-border shadow-md">
            <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 px-5 pb-8 pt-4 text-white sm:px-6 sm:pb-10 sm:pt-5">
              <div className="flex min-w-0 animate-pulse items-start justify-between gap-3 sm:gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                  <div className="aspect-square w-14 shrink-0 rounded-xl bg-white/20 sm:w-16 md:w-20" aria-hidden />
                  <div className="min-w-0 flex-1 space-y-3 pr-1 pt-0.5">
                    <div className="h-8 w-44 max-w-[85%] rounded-md bg-white/25 sm:h-9 sm:w-52" aria-hidden />
                    <div className="h-4 w-full max-w-md rounded-md bg-white/15" aria-hidden />
                    <div className="hidden h-4 max-w-sm rounded-md bg-white/10 sm:block sm:w-[70%]" aria-hidden />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {heroTrailingAction}
                  {showHeroClose ? (
                    <HeroCloseLink
                      backHref={backHref}
                      backToHubAriaLabel={backToHubAriaLabel}
                      preferHistory={heroClosePreferHistory}
                    />
                  ) : (
                    <span className="h-8 w-8 shrink-0 sm:h-9 sm:w-9 md:h-10 md:w-10 xl:h-11 xl:w-11" aria-hidden />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 min-w-0 pb-8 sm:mt-8 sm:pb-10">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="overflow-hidden rounded-2xl border border-border shadow-md">
          <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 px-5 pb-8 pt-4 text-white sm:px-6 sm:pb-10 sm:pt-5">
            {vendorHeroLayout ? (
              <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                    <div className="aspect-square w-14 shrink-0 overflow-hidden rounded-xl border border-white/30 bg-white/10 shadow-md ring-1 ring-black/10 sm:w-16 md:w-20">
                      <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1 pr-1">
                      <h1 className="flex min-w-0 items-center gap-2 text-balance text-2xl font-bold leading-tight sm:gap-2.5 sm:text-3xl">
                        <span className="min-w-0">{title}</span>
                        {heroTitleVerified ? (
                          <BadgeCheck
                            className="h-4 w-4 shrink-0 text-orange-100 drop-shadow sm:h-[1.125rem] sm:w-[1.125rem]"
                            aria-label={heroTitleVerifiedAriaLabel || "Verified vendor"}
                          />
                        ) : null}
                      </h1>
                      {heroBelowTitle ? <div className="min-w-0 pt-2">{heroBelowTitle}</div> : null}
                      {locationLine ? (
                        <p className="flex items-start gap-2 text-sm leading-snug text-orange-50/95 sm:text-base">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
                          <span className="min-w-0">{locationLine}</span>
                        </p>
                      ) : null}
                      {fulfillmentLine ? (
                        <p className="text-sm leading-snug text-orange-50/95 sm:text-base">{fulfillmentLine}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {heroTrailingAction}
                    {showHeroClose ? (
                      <HeroCloseLink
                        backHref={backHref}
                        backToHubAriaLabel={backToHubAriaLabel}
                        preferHistory={heroClosePreferHistory}
                      />
                    ) : (
                      <span className="h-8 w-8 shrink-0 sm:h-9 sm:w-9 md:h-10 md:w-10 xl:h-11 xl:w-11" aria-hidden />
                    )}
                  </div>
                </div>
                {subtitle ? (
                  <p className="min-w-0 max-w-none text-pretty text-sm/6 text-orange-50/95 sm:text-base/7">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1 space-y-1 pr-1">
                  <h1 className="flex min-w-0 items-center gap-2 text-balance text-2xl font-bold leading-tight sm:gap-2.5 sm:text-3xl">
                    <span className="min-w-0">{title}</span>
                    {heroTitleVerified ? (
                      <BadgeCheck
                        className="h-4 w-4 shrink-0 text-orange-100 drop-shadow sm:h-[1.125rem] sm:w-[1.125rem]"
                        aria-label={heroTitleVerifiedAriaLabel || "Verified vendor"}
                      />
                    ) : null}
                  </h1>
                  {heroBelowTitle ? <div className="min-w-0 pt-2">{heroBelowTitle}</div> : null}
                  {locationLine ? (
                    <p className="flex items-start gap-2 text-sm leading-snug text-orange-50/95 sm:text-base">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      <span className="min-w-0">{locationLine}</span>
                    </p>
                  ) : null}
                  {fulfillmentLine ? (
                    <p className="text-sm leading-snug text-orange-50/95 sm:text-base">{fulfillmentLine}</p>
                  ) : null}
                  {subtitle ? (
                    <p className="max-w-xl pt-1 text-sm/6 text-orange-50 sm:text-base/7">{subtitle}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {heroTrailingAction}
                  {showHeroClose ? (
                    <HeroCloseLink
                      backHref={backHref}
                      backToHubAriaLabel={backToHubAriaLabel}
                      preferHistory={heroClosePreferHistory}
                    />
                  ) : (
                    <span className="h-8 w-8 shrink-0 sm:h-9 sm:w-9 md:h-10 md:w-10 xl:h-11 xl:w-11" aria-hidden />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 min-w-0 pb-8 sm:mt-8 sm:pb-10">{children}</div>
      </div>
    </div>
  )
}
