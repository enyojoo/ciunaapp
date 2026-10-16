"use client"
import * as React from "react"
import Link from "next/link"
import { NoAccess, PageHeader } from "@ciuna/ui-web"
import { useSeller } from "@/lib/session"
import { useT } from "@/lib/i18n"

/** Seller wrapper over the shared NoAccess: page heading, localised copy, link back to Home. */
export function SellerNoAccess({ pageTitle, titleKey = "noAccess.title", bodyKey = "noAccess.body" }: { pageTitle?: string; titleKey?: string; bodyKey?: string }) {
  const { t } = useT()
  return (
    <>
      {pageTitle ? <PageHeader title={pageTitle} /> : null}
      <NoAccess title={t(titleKey)} reason={t(bodyKey)} backHref="/" backLabel={t("noAccess.back")} linkAs={Link} />
    </>
  )
}

/** Renders the lock screen unless the signed-in member holds `permission`. Waits for the merchant to load. */
export function RequirePermission({ permission, titleKey, bodyKey, children }: { permission: string; titleKey?: string; bodyKey?: string; children: React.ReactNode }) {
  const { merchant, can } = useSeller()
  if (!merchant) return <>{children}</>
  if (!can(permission)) return <SellerNoAccess titleKey={titleKey} bodyKey={bodyKey} />
  return <>{children}</>
}
