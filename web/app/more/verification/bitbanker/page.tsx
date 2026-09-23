"use client"

import Link from "next/link"
import { useTranslation } from "react-i18next"
import { AppPageHeader } from "@/components/layout/app-page-header"
import { useAuth } from "@/lib/auth-context"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import { BitbankerVerificationForm } from "@/components/verification/bitbanker-verification-form"
import { Button } from "@/components/ui/button"
import { VerificationHubSkeleton } from "@/components/verification-hub-skeleton"

export default function BitbankerVerificationPage() {
  const { t } = useTranslation("app")
  const { user, userProfile } = useAuth()
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
  const status = data?.status ?? "not_started"

  return (
    <div className="mx-auto max-w-lg px-4 pb-12">
      <AppPageHeader title={t("verification.bitbanker.pageTitle")} backHref="/more/verification" />
      <p className="mb-6 text-sm text-muted-foreground">{t("verification.bitbanker.intro")}</p>

      {verified ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
          <p className="font-medium text-green-900">{t("verification.bitbanker.verifiedTitle")}</p>
          <Button type="button" variant="outline" onClick={() => void refresh()}>
            {t("verification.bitbanker.refreshStatus")}
          </Button>
          <div>
            <Button asChild>
              <Link href="/send">{t("verification.bitbanker.goToSend")}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm">
            {t("verification.bitbanker.statusLabel")}: <span className="font-medium">{status}</span>
          </p>
          {(status === "checking" || status === "not_verified") && (
            <Button type="button" variant="outline" onClick={() => void refresh()}>
              {t("verification.bitbanker.checkAgain")}
            </Button>
          )}
          {status !== "verified" && (
            <BitbankerVerificationForm
              defaultEmail={userProfile?.email ?? user.email ?? ""}
              onSubmitted={() => void refresh()}
            />
          )}
        </div>
      )}
    </div>
  )
}
