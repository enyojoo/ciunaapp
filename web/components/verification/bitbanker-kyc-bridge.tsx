"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useSearchParams, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { ExternalLink, Loader2, ShieldCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useBitbankerKycBridge } from "@/lib/use-bitbanker-kyc-bridge"
import { cn } from "@/lib/utils"

const POLL_MS = 8000
const RETURN_KEY = "ciuna:send-return-path"

/**
 * Web cannot iframe Bitbanker (frame-ancestors none / X-Frame-Options DENY).
 * Keep a Ciuna modal as the verification surface; open partner KYC in a new tab and poll.
 */
export function BitbankerKycBridge() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo")
  const { user, userProfile } = useAuth()
  const email = userProfile?.email ?? user?.email ?? ""
  const { state, loading, error, refresh, startSession } = useBitbankerKycBridge()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastErrorToastRef = useRef<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [hostedUrl, setHostedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!error) {
      lastErrorToastRef.current = null
      return
    }
    if (lastErrorToastRef.current === error) return
    lastErrorToastRef.current = error
    toast.error(error)
  }, [error])

  useEffect(() => {
    if (returnTo === "send" && typeof window !== "undefined") {
      sessionStorage.setItem(RETURN_KEY, "/send")
    }
    void refresh()
  }, [returnTo, refresh])

  useEffect(() => {
    const onFocus = () => void refresh({ poll: true })
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [refresh])

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const startPoll = useCallback(() => {
    stopPoll()
    pollRef.current = setInterval(() => {
      void refresh({ poll: true })
    }, POLL_MS)
  }, [refresh, stopPoll])

  useEffect(() => {
    if (state?.eligibility.isVerifiedForSbp) {
      stopPoll()
      setSheetOpen(false)
      setHostedUrl(null)
      toast.success(
        t("verification.kycBridge.verifiedToast", {
          defaultValue: "Identity verified. You can send with SBP.",
        }),
      )
      const stored =
        typeof window !== "undefined" ? sessionStorage.getItem(RETURN_KEY) : null
      if (stored) {
        sessionStorage.removeItem(RETURN_KEY)
        router.push(stored)
      }
    }
  }, [state?.eligibility.isVerifiedForSbp, router, stopPoll, t])

  useEffect(() => () => stopPoll(), [stopPoll])

  const openPartnerTab = (url: string) => {
    const opened = window.open(url, "_blank", "noopener,noreferrer")
    if (!opened) {
      toast.message(
        t("verification.kycBridge.allowPopups", {
          defaultValue: "Allow pop-ups to open verification, or tap Open verification again.",
        }),
      )
    }
  }

  const openHosted = async (url: string, paymentUrl: string | null) => {
    if (paymentUrl) {
      await refresh({ poll: true })
      router.push("/send")
      return
    }
    setHostedUrl(url)
    setSheetOpen(true)
    startPoll()
    openPartnerTab(url)
    void refresh({ poll: true })
  }

  const onVerify = async () => {
    const session = state?.session
    if (session?.kycUrl && new Date(session.expiresAt).getTime() > Date.now()) {
      await openHosted(session.kycUrl, session.paymentUrl)
      return
    }
    const created = await startSession(email)
    await openHosted(created.kycUrl, created.paymentUrl)
  }

  const hasActiveSession =
    state?.session?.kycUrl && new Date(state.session.expiresAt).getTime() > Date.now()

  const primaryLabel = hasActiveSession
    ? t("verification.kycBridge.continueCta", { defaultValue: "Continue verification" })
    : t("verification.kycBridge.verifyCta", { defaultValue: "Verify identity" })

  const closeSheet = () => {
    setSheetOpen(false)
    void refresh({ poll: true })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        {t("verification.kycBridge.lead", {
          defaultValue:
            "Verify with our payment partner (Bitbanker). Russian and foreign passports are supported; routing to IIDX or Sumsub is handled on their secure page—not in Ciuna.",
        })}
      </p>

      <Button type="button" className="w-full" disabled={loading} onClick={() => void onVerify()}>
        {primaryLabel}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={() => void refresh({ poll: true })}
      >
        {t("verification.bitbanker.refreshStatus", { defaultValue: "Refresh status" })}
      </Button>

      {state?.session?.expiresAt ? (
        <p className="text-xs text-muted-foreground">
          {t("verification.kycBridge.linkExpires", {
            defaultValue: "Verification link expires at {{time}} (about one hour).",
            time: new Date(state.session.expiresAt).toLocaleTimeString(),
          })}
        </p>
      ) : null}

      {state?.eligibility.status === "checking" ? (
        <p className="text-xs text-muted-foreground">
          {t("verification.kycBridge.reviewPending", {
            defaultValue:
              "Verification in progress or under review. We will unlock send when Bitbanker confirms SBP.",
          })}
        </p>
      ) : null}

      {sheetOpen && hostedUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div
            className={cn(
              "relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl",
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="kyc-sheet-title"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 id="kyc-sheet-title" className="text-base font-semibold text-foreground">
                {t("verification.kycBridge.screenTitle", { defaultValue: "Verify identity" })}
              </h2>
              <button
                type="button"
                onClick={closeSheet}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/40"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
                <ShieldCheck className="h-7 w-7 text-orange-700" />
              </div>
              <p className="text-lg font-semibold text-foreground">
                {t("verification.kycBridge.inAppSecureTitle", {
                  defaultValue: "Continue securely with our partner",
                })}
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t("verification.kycBridge.inAppSecureBody", {
                  defaultValue:
                    "For security, Bitbanker opens verification in a protected window. Finish KYC there — this screen stays open and updates when you’re verified.",
                })}
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("verification.kycBridge.waitingPartner", {
                  defaultValue: "Waiting for verification…",
                })}
              </div>
              <Button type="button" className="mt-2 w-full" onClick={() => openPartnerTab(hostedUrl)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("verification.kycBridge.openPartner", { defaultValue: "Open verification" })}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={closeSheet}>
                {t("verification.kycBridge.refreshAfter", {
                  defaultValue: "I’ve finished — check status",
                })}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
