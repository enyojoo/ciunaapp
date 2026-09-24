"use client"

import Link from "next/link"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"
import { AppPageHeader } from "@/components/layout/app-page-header"
import { useAuth } from "@/lib/auth-context"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import { BitbankerKycBridge } from "@/components/verification/bitbanker-kyc-bridge"
import { Button } from "@/components/ui/button"
import { VerificationHubSkeleton } from "@/components/verification-hub-skeleton"

function BitbankerVerificationInner() {
  const { t } = useTranslation("app")
  const { user } = useAuth()
  const { data, isLoading, refresh } = useBitbankerEligibility(user?.id)

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="text-muted-foreground">{t("auth.signIn")}</p>
      </div>
    )
  }

  if (isLoading && !data) {
    return <VerificationHubSkeleton />
  }

  const verified = data?.isVerifiedForSbp

  return (
    <div className="mx-auto max-w-lg px-4 pb-12">
      <AppPageHeader
        title={t("verification.kycBridge.screenTitle", { defaultValue: "Verify identity" })}
        backHref="/more/verification"
      />

      {verified ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
          <p className="font-medium text-green-900">{t("verification.bitbanker.verifiedTitle")}</p>
          <p className="text-sm text-green-800">{t("verification.kycBridge.successBody")}</p>
          <Button asChild>
            <Link href="/send">{t("verification.bitbanker.goToSend")}</Link>
          </Button>
        </div>
      ) : (
        <BitbankerKycBridge />
      )}
    </div>
  )
}

export default function BitbankerVerificationPage() {
  return (
    <Suspense fallback={<VerificationHubSkeleton />}>
      <BitbankerVerificationInner />
    </Suspense>
  )
}
