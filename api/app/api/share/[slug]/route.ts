import { APP_URLS, REFERRAL_SHARE, resolveAppUrl } from "@ciuna/shared"
import { createServerClient } from "@/lib/supabase"
import { findReferrerRowBySlug } from "@/lib/referral-lookup"
import { RESERVED_REFERRAL_SLUGS } from "@/lib/referral-slug"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug?.trim() || ""
  const appUrl = resolveAppUrl()
  const pageUrl = `${appUrl}/${slug}`
  const registerUrl = `${appUrl}/auth/register?ref=${encodeURIComponent(slug)}`

  let found = false
  if (slug && slug.length >= 8 && !RESERVED_REFERRAL_SLUGS.has(slug)) {
    const supabase = createServerClient()
    const ref = await findReferrerRowBySlug(supabase, slug)
    found = Boolean(ref?.id)
  }

  const title = escapeHtml(REFERRAL_SHARE.title)
  const description = escapeHtml(REFERRAL_SHARE.description)
  const image = escapeHtml(REFERRAL_SHARE.imageUrl)
  const canonical = escapeHtml(found ? pageUrl : APP_URLS.app)

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <meta name="description" content="${description}"/>
  <link rel="canonical" href="${canonical}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${description}"/>
  <meta property="og:url" content="${canonical}"/>
  <meta property="og:site_name" content="Ciuna"/>
  <meta property="og:image" content="${image}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:image:alt" content="${escapeHtml(REFERRAL_SHARE.imageAlt)}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${description}"/>
  <meta name="twitter:image" content="${image}"/>
  <meta http-equiv="refresh" content="0;url=${escapeHtml(found ? registerUrl : `${appUrl}/auth/register`)}"/>
</head>
<body>
  <p><a href="${escapeHtml(found ? registerUrl : `${appUrl}/auth/register`)}">${title}</a></p>
</body>
</html>`

  return new Response(html, {
    status: found ? 200 : 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  })
}
