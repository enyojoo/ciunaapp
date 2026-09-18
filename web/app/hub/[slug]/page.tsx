"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { HubServiceCatalogPage } from "@/components/hub/hub-service-catalog-page"

export default function HubServiceCatalogRoutePage() {
  const slug = String(useParams()?.slug || "").trim().toLowerCase()
  const router = useRouter()

  /** Marketplaces have their own dedicated /food and /mart pages — keep /hub/[slug] for other lines. */
  useEffect(() => {
    if (slug === "food") router.replace("/food")
    else if (slug === "mart") router.replace("/mart")
    else if (slug === "experts") router.replace("/experts")
  }, [slug, router])

  if (slug === "food" || slug === "mart" || slug === "experts") return null

  return <HubServiceCatalogPage key={slug} slug={slug} />
}
