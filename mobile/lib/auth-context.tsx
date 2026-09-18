import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { Platform } from "react-native"
import * as AuthSession from "expo-auth-session"
import * as WebBrowser from "expo-web-browser"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import i18n, { setAppLocale, type AppLocale, SUPPORTED_LOCALES } from "./i18n"
import { apiFetch } from "./api"
import { hasPin } from "./pin"

WebBrowser.maybeCompleteAuthSession()

type Profile = {
  id: string
  email: string
  first_name?: string
  last_name?: string
  preferred_language?: AppLocale | null
}

type AuthCtx = {
  user: User | null
  profile: Profile | null
  loading: boolean
  pinUnlocked: boolean
  unlockPin: () => void
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

function oauthRedirect(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`
  }
  return AuthSession.makeRedirectUri({ scheme: "ciuna", path: "auth/callback" })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [pinUnlocked, setPinUnlocked] = useState(false)

  const applySessionUser = useCallback(async (sessionUser: User | null) => {
    setUser(sessionUser)
    if (!sessionUser) {
      setProfile(null)
      setPinUnlocked(false)
      return
    }
    const { data } = await supabase.from("users").select("*").eq("id", sessionUser.id).maybeSingle()
    const row = data as Profile | null
    setProfile(row)
    const pref = row?.preferred_language
    if (pref && (SUPPORTED_LOCALES as readonly string[]).includes(pref) && i18n.language.split("-")[0] !== pref) {
      await setAppLocale(pref)
    }
    const locked = await hasPin(sessionUser.id)
    setPinUnlocked(!locked)
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      void applySessionUser(data.session?.user ?? null).finally(() => {
        if (mounted) setLoading(false)
      })
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      void applySessionUser(session?.user ?? null)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [applySessionUser])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = oauthRedirect()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    })
    if (error) return { error: error.message }
    if (!data.url) return { error: "Could not start Google sign-in" }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
    if (result.type !== "success" || !("url" in result) || !result.url) {
      return { error: result.type === "cancel" ? null : "Google sign-in did not complete" }
    }
    const parsed = new URL(result.url)
    const code = parsed.searchParams.get("code")
    if (code) {
      const exchanged = await supabase.auth.exchangeCodeForSession(code)
      if (exchanged.error) return { error: exchanged.error.message }
    }
    return { error: null }
  }, [])

  const signUp = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    const check = await apiFetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (check.ok) {
      const body = (await check.json()) as { exists?: boolean }
      if (body.exists) return { error: "An account with this email already exists" }
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const unlockPin = useCallback(() => setPinUnlocked(true), [])

  const value = useMemo(
    () => ({ user, profile, loading, pinUnlocked, unlockPin, signIn, signInWithGoogle, signUp, signOut }),
    [user, profile, loading, pinUnlocked, unlockPin, signIn, signInWithGoogle, signUp, signOut],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
