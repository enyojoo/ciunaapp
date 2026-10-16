import type { Metadata } from "next"

import { SEO_PAGE_DESCRIPTIONS, SEO_PAGE_TITLES } from "@/lib/seo"

/** Discovery + booking depend on live slots and session; do not statically cache route output. */
export const dynamic = "force-dynamic"

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

/**
 * No layout-level Suspense — avoids a duplicate fallback blink. Individual
 * routes add `<Suspense fallback={null}>` only where Next.js requires it for
 * `useSearchParams` during prerender (e.g. `/auth/login`).
 */
export default function ExpertsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
