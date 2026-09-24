"use client"

/**
 * Deep-link / resume page for online pay. Primary checkout UX embeds
 * YooKassaCheckoutWidget inline on the pay step instead of navigating here.
 */

import { useParams, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { AppPageHeader } from "@/components/layout/app-page-header"
import { Button } from "@/components/ui/button"
import { YooKassaCheckoutWidget } from "@/components/yookassa-checkout-widget"

export default function YooKassaPayPage() {
  const { t } = useTranslation("app")
  const params = useParams()
  const router = useRouter()
  const transactionId = String(params.transactionId || "").trim()

  return (
    <div className="min-w-0 space-y-0">
      <AppPageHeader title={t("hub.pay.title", { defaultValue: "Pay online" })} backHref="/transactions" />
      <div className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-md space-y-4">
          {transactionId ? (
            <YooKassaCheckoutWidget
              transactionId={transactionId}
              onCompleted={(id) => router.replace(`/hub/orders/${id.toLowerCase()}`)}
              onFailed={() => undefined}
            />
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              {t("hub.pay.missingToken", { defaultValue: "This payment link has expired." })}
            </p>
          )}
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              {t("layout.back", { defaultValue: "Back" })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
