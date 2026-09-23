"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronRight, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LanguagePicker } from "@/components/i18n/language-picker"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import { InstallAppCard } from "@/components/pwa/install-app-card"
import { LoginPinDialog } from "@/components/app-lock/login-pin-dialog"
import { hasPin } from "@/lib/login-pin"

export default function MorePage() {
  const { t } = useTranslation("common")
  const router = useRouter()
  const { signOut, userProfile } = useAuth()
  const [pinDialogOpen, setPinDialogOpen] = useState(false)
  const [pinDialogMode, setPinDialogMode] = useState<"create" | "change">("create")

  const openLoginPin = () => {
    if (!userProfile?.id) return
    setPinDialogMode(hasPin(userProfile.id) ? "change" : "create")
    setPinDialogOpen(true)
  }
  
  const { data: bitbankerEligibility } = useBitbankerEligibility(userProfile?.id)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handlePrivacy = () => {
    window.open("https://www.ciuna.com/privacy", "_blank")
  }

  const handleTerms = () => {
    window.open("https://www.ciuna.com/terms", "_blank")
  }

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoggingOut(false)
      setShowLogoutDialog(false)
    }
  }

  const verificationStatus = useMemo(() => {
    if (bitbankerEligibility?.isVerifiedForSbp) {
      return { status: "verified" as const, label: t("kyc.verified"), className: "bg-green-100 text-green-700" }
    }
    if (bitbankerEligibility?.status === "checking") {
      return { status: "in_review" as const, label: t("kyc.inReview"), className: "bg-yellow-100 text-yellow-700" }
    }
    if (bitbankerEligibility?.status === "not_verified") {
      return { status: "rejected" as const, label: t("kyc.rejected"), className: "bg-red-100 text-red-700" }
    }
    if (bitbankerEligibility?.status === "unavailable") {
      return { status: "pending" as const, label: t("kyc.pending"), className: "bg-gray-100 text-gray-700" }
    }
    return { status: "not_started" as const, label: t("kyc.takeAction"), className: "bg-amber-100 text-amber-700" }
  }, [bitbankerEligibility, t])

  return (
    <>
    <div className="space-y-0">
        {/* Header - Mobile Style */}
        <div className="bg-white p-5 sm:p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{t("more.title")}</h1>
        </div>

        {/* Content */}
        <div className="px-5 sm:px-6 pt-3 sm:pt-4 pb-5 sm:pb-6 space-y-4 sm:space-y-5">
          <InstallAppCard />

          {/* Account Section */}
          <Card className="gap-2 py-5">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-semibold">{t("more.account")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 pt-1">
              <Link
                href="/more/profile"
                className="w-full flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <span className="text-base text-gray-900">{t("more.yourProfile")}</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
              <Link
                href="/more/verification"
                className="w-full flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <span className="text-base text-gray-900">{t("more.accountVerification")}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${verificationStatus.className}`}
                  >
                    {verificationStatus.label}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
              <Link
                href="/more/referrals"
                className="w-full flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <span className="text-base text-gray-900">{t("more.affiliatesReferrals")}</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
              <button
                type="button"
                onClick={openLoginPin}
                className="w-full flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-base text-gray-900">{t("more.loginPin")}</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </CardContent>
          </Card>

          {/* App Section */}
          <Card className="gap-2 py-5">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-semibold">{t("more.app")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 pt-1">
              <LanguagePicker />
              <Link
                href="/recipients"
                className="w-full flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <span className="text-base text-gray-900">{t("more.recipients")}</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
              <Link
                href="/support"
                className="w-full flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <span className="text-base text-gray-900">{t("more.support")}</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
              <button
                onClick={handlePrivacy}
                className="w-full flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <span className="text-base text-gray-900">{t("more.privacyPolicy")}</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
              <button
                onClick={handleTerms}
                className="w-full flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <span className="text-base text-gray-900">{t("more.termsOfService")}</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </CardContent>
          </Card>

          {/* Sign Out Button - Mobile/Tablet only */}
          <div className="pt-6 lg:hidden">
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() => setShowLogoutDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2"
              >
                <LogOut className="mr-2 h-5 w-5" />
                <span>{t("more.logout")}</span>
              </Button>
            </div>
          </div>

          {/* App Version */}
          <div className="text-center py-5">
            <p className="text-sm text-gray-400">{t("more.version", { version: "1.0.0" })}</p>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("more.signOutTitle")}</DialogTitle>
            <DialogDescription>{t("more.signOutDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={isLoggingOut}
            >
              {t("more.cancel")}
            </Button>
            <Button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoggingOut ? t("more.signingOut") : t("more.signOut")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {userProfile?.id ? (
        <LoginPinDialog
          open={pinDialogOpen}
          onOpenChange={setPinDialogOpen}
          userId={userProfile.id}
          mode={pinDialogMode}
        />
      ) : null}
    </>
  )
}
