import type { Metadata } from "next"

import { SEO_PAGE_DESCRIPTIONS, SEO_PAGE_TITLES } from "@/lib/seo"

export const metadata = {
  title: SEO_PAGE_TITLES.moreVerificationAddress,
  description: SEO_PAGE_DESCRIPTIONS.moreVerificationAddress,
  robots: {
    index: false,
    follow: false,
    noindex: true,
    nofollow: true,
  },
} as unknown as Metadata

export default function MoreVerificationAddressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
