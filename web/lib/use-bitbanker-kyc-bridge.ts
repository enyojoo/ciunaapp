"use client"

import { useCallback, useState } from "react"
import { fetchWithAuth } from "@/lib/fetch-with-auth"

export type KycBridgeSession = {
  sessionId: string
  kycUrl: string
  paymentUrl: string | null
  provider: string | null
  expiresAt: string
  status: "active" | "expired"
  reused?: boolean
}

export type KycBridgeState = {
  session: KycBridgeSession | null
  eligibility: {
    status: string
    isVerifiedForSbp: boolean
    clientId: string | null
  }
}

export function useBitbankerKycBridge() {
  const [state, setState] = useState<KycBridgeState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (opts?: { poll?: boolean }) => {
    setLoading(true)
    setError(null)
    try {
      const url = opts?.poll
        ? "/api/bitbanker/kyc/session?refresh=1"
        : "/api/bitbanker/kyc/session"
      const res = await fetchWithAuth(url)
      const body = (await res.json().catch(() => ({}))) as KycBridgeState & { error?: string }
      if (!res.ok) {
        throw new Error(body.error || "Failed to load verification session")
      }
      setState(body)
      return body
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load verification session"
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const startSession = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchWithAuth("/api/bitbanker/kyc/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const body = (await res.json().catch(() => ({}))) as {
        session?: KycBridgeSession
        error?: string
      }
      if (!res.ok) {
        throw new Error(body.error || "Failed to start verification")
      }
      if (!body.session?.kycUrl) {
        throw new Error("No verification link returned")
      }
      await refresh()
      return body.session
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start verification"
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [refresh])

  return { state, loading, error, refresh, startSession, setError }
}
