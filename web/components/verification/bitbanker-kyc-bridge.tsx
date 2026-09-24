"use client"

import { useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import { useSearchParams, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useBitbankerKycBridge } from "@/lib/use-bitbanker-kyc-bridge"

const POLL_MS = 8000
const RETURN_KEY = "ciuna:send-return-path"

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
      const stored =
        typeof window !== "undefined" ? sessionStorage.getItem(RETURN_KEY) : null
      if (stored) {
        sessionStorage.removeItem(RETURN_KEY)
        router.push(stored)
      }
    }
  }, [state?.eligibility.isVerifiedForSbp, router, stopPoll])

  useEffect(() => () => stopPoll(), [stopPoll])

  const openHosted = async (url: string, paymentUrl: string | null) => {
    if (paymentUrl) {
      await refresh({ poll: true })
      router.push("/send")
      return
    }
    startPoll()
    window.open(url, "_blank", "noopener,noreferrer")
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

      <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={() => void refresh({ poll: true })}>
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
            defaultValue: "Verification in progress or under review. We will unlock send when Bitbanker confirms SBP.",
          })}
        </p>
      ) : null}
    </div>
  )
}
