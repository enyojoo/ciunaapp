import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { APP_URLS, REFERRAL_SHARE, resolveApiUrl } from "@ciuna/shared"
import { RESERVED_REFERRAL_SLUGS } from "@/lib/referral-slug"
import { ReferralClientRedirect } from "./referral-client-redirect"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ referralSlug: string }> }

async function resolveSlug(params: Props["params"]) {
  const { referralSlug } = await params
  return referralSlug.trim()
}

async function lookupReferral(slug: string): Promise<{ ok: boolean } | null> {
  try {
    const res = await fetch(`${resolveApiUrl()}/api/referrals/preview/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as { ok: boolean }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = await resolveSlug(params)
  if (!slug || slug.length < 8 || RESERVED_REFERRAL_SLUGS.has(slug)) {
    return { title: "Not found" }
  }

  const ref = await lookupReferral(slug)
  if (!ref?.ok) {
    return { title: "Not found" }
  }

  const pageUrl = `${APP_URLS.app}/${slug}`

  return {
    title: REFERRAL_SHARE.title,
    description: REFERRAL_SHARE.description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      title: REFERRAL_SHARE.title,
      description: REFERRAL_SHARE.description,
      url: pageUrl,
      siteName: "Ciuna",
      locale: "en_US",
      images: [
        {
          url: REFERRAL_SHARE.imageUrl,
          width: 1200,
          height: 630,
          alt: REFERRAL_SHARE.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: REFERRAL_SHARE.title,
      description: REFERRAL_SHARE.description,
      images: [REFERRAL_SHARE.imageUrl],
    },
  }
}

export default async function ReferralLandingPage({ params }: Props) {
  const slug = await resolveSlug(params)

  if (!slug || slug.length < 8 || RESERVED_REFERRAL_SLUGS.has(slug)) {
    notFound()
  }

  const ref = await lookupReferral(slug)
  if (!ref?.ok) {
    notFound()
  }

  return <ReferralClientRedirect slug={slug} />
}
