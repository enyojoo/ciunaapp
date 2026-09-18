"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { claimReferralWithRetryForOAuthCallback } from "@/lib/referral-client"
import { REDIRECT_AFTER_LOGIN_KEY } from "@/lib/auth-login-redirect"
import { useTranslation } from "react-i18next"

/** Read OAuth params from the live URL (query + hash). */
function getOAuthParamsFromWindow(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams()
  const url = new URL(window.location.href)
  const merged = new URLSearchParams()
  if (url.hash?.startsWith("#")) {
    new URLSearchParams(url.hash.slice(1)).forEach((v, k) => merged.set(k, v))
  }
  url.searchParams.forEach((v, k) => merged.set(k, v))
  return merged
}

export default function AuthCallbackPage() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const params = getOAuthParamsFromWindow()
      const nativeRedirect = params.get("app_redirect")
      if (nativeRedirect && /^(ciuna|exp):\/\//i.test(nativeRedirect)) {
        params.delete("app_redirect")
        const leftover = params.toString()
        const dest = leftover
          ? `${nativeRedirect}${nativeRedirect.includes("?") ? "&" : "?"}${leftover}`
          : nativeRedirect
        window.location.replace(`${dest}${typeof window !== "undefined" ? window.location.hash : ""}`)
        return
      }
      const errorParam = params.get("error")

      if (errorParam) {
        setError(errorParam === "access_denied" ? t("auth.callbackCancelled") : errorParam)
        setTimeout(() => router.replace("/auth/login"), 2000)
        return
      }

      // getSession() awaits client init, which parses #fragment (implicit) or ?code (PKCE) when detectSessionInUrl is true
      const { data: { session: afterInit } } = await supabase.auth.getSession()
      if (afterInit) {
        await claimReferralWithRetryForOAuthCallback()
        const isAdmin = afterInit.user?.user_metadata?.isAdmin ?? false
        if (isAdmin) {
          router.replace("/admin/dashboard")
          return
        }
        const next = typeof window !== "undefined" ? sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)?.trim() : ""
        if (next?.startsWith("/") && !next.startsWith("/auth/")) {
          sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY)
          router.replace(next)
          return
        }
        router.replace("/hub")
        return
      }

      const code = params.get("code")
      if (code) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            setError(exchangeError.message)
            setTimeout(() => router.replace("/auth/login"), 2000)
            return
          }
          await claimReferralWithRetryForOAuthCallback()
          const isAdmin = data?.user?.user_metadata?.isAdmin ?? false
          if (isAdmin) {
            router.replace("/admin/dashboard")
            return
          }
          const next = typeof window !== "undefined" ? sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)?.trim() : ""
          if (next?.startsWith("/") && !next.startsWith("/auth/")) {
            sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY)
            router.replace(next)
            return
          }
          router.replace("/hub")
        } catch (err: any) {
          setError(err?.message || t("auth.callbackFailedSignIn"))
          setTimeout(() => router.replace("/auth/login"), 2000)
        }
        return
      }

      router.replace("/auth/login")
    }

    handleCallback()
  }, [router, t])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-6">
          <p className="text-destructive mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">{t("auth.callbackRedirectLogin")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
