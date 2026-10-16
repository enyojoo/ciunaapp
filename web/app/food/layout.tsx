import type { Metadata } from "next"

import { SEO_PAGE_DESCRIPTIONS, SEO_PAGE_TITLES } from "@/lib/seo"

export const metadata = {
  title: SEO_PAGE_TITLES.hub,
  description: SEO_PAGE_DESCRIPTIONS.hub,
  robots: {
    index: false,
    noindex: true,
    follow: false,
    nofollow: true,
  },
} as unknown as Metadata

/** No layout-level Suspense — avoids empty fallback blink when navigating from `/hub` (matches `/send`, `/transactions`). */
export default function FoodHubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
