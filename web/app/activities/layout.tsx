import type { Metadata } from "next"

import { SEO_PAGE_DESCRIPTIONS, SEO_PAGE_TITLES } from "@/lib/seo"

export const metadata: Metadata = {
  title: SEO_PAGE_TITLES.transactions,
  description: SEO_PAGE_DESCRIPTIONS.transactions,
  robots: {
    index: false,
    follow: false,
  },
}

export default function TransactionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
