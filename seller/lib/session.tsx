"use client"
import * as React from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import { api, setActiveMerchantId } from "./api"
import { invalidate } from "./query"

export interface SellerMerchant {
  id: string
  type: "store" | "expert"
  slug: string
  display_name: string
  status: "draft" | "in_review" | "live" | "paused" | "rejected" | "suspended"
  country: string
  operating_country: string
  languages: string[]
  default_language: string
  default_currency: string
  logo_url: string | null
  cover_url: string | null
  description: Record<string, string>
  contact_email: string | null
  contact_phone: string | null
  website: string | null
  service_line: "food" | "mart" | null
  role: "owner" | "manager" | "staff" | "finance"
  permissions: string[]
  rejection_reason: string | null
  kyb_tier: number
}

interface Me {
  user: { id: string; email: string; name: string | null }
  merchants: SellerMerchant[]
  invites: Array<{ id: string; role: string; token: string; merchants: { id: string; display_name: string; type: string } }>
}

interface Ctx {
  ready: boolean
  session: Session | null
  me: Me | null
  merchant: SellerMerchant | null
  setMerchantId: (id: string) => void
  refresh: () => Promise<void>
  can: (permission: string) => boolean
  signOut: () => Promise<void>
}

const SessionCtx = React.createContext<Ctx>(null as unknown as Ctx)
export const useSeller = () => React.useContext(SessionCtx)
const STORE_KEY = "ciuna.seller.merchant"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false)
  const [session, setSession] = React.useState<Session | null>(null)
  const [me, setMe] = React.useState<Me | null>(null)
  const [merchantId, setMerchantIdState] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
    if (!data.session) {
      setMe(null)
      setReady(true)
      return
    }
    try {
      const m = await api<Me>("/api/merchant/me", { merchantId: null })
      setMe(m)
      let saved: string | null = null
      try { saved = localStorage.getItem(STORE_KEY) } catch {}
      const pick = m.merchants.find((x) => x.id === saved)?.id ?? m.merchants[0]?.id ?? null
      setActiveMerchantId(pick)
      setMerchantIdState(pick)
    } catch {
      setMe(null)
    } finally {
      setReady(true)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) { setMe(null); setActiveMerchantId(null); setMerchantIdState(null) }
      else void refresh()
    })
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  const merchant = me?.merchants.find((m) => m.id === merchantId) ?? null
  const value: Ctx = {
    ready,
    session,
    me,
    merchant,
    setMerchantId: (id) => {
      setActiveMerchantId(id)
      setMerchantIdState(id)
      try { localStorage.setItem(STORE_KEY, id) } catch {}
      invalidate()
    },
    refresh,
    can: (p) => Boolean(merchant?.permissions.includes(p)),
    signOut: async () => {
      await supabase.auth.signOut()
      invalidate()
    },
  }
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
}
