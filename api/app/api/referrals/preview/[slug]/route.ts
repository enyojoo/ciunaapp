import { NextResponse } from "next/server"
import { APP_URLS, REFERRAL_SHARE, resolveAppUrl } from "@ciuna/shared"
import { createServerClient } from "@/lib/supabase"
import { findReferrerRowBySlug } from "@/lib/referral-lookup"
import { RESERVED_REFERRAL_SLUGS } from "@/lib/referral-slug"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug?.trim() || ""
  if (!slug || slug.length < 8 || RESERVED_REFERRAL_SLUGS.has(slug)) {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  const supabase = createServerClient()
  const ref = await findReferrerRowBySlug(supabase, slug)
  if (!ref?.id) {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    slug,
    url: `${resolveAppUrl()}/${slug}`,
    title: REFERRAL_SHARE.title,
    description: REFERRAL_SHARE.description,
    imageUrl: REFERRAL_SHARE.imageUrl,
  })
}
