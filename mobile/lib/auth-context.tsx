import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Platform } from "react-native"
import * as Linking from "expo-linking"
import * as WebBrowser from "expo-web-browser"
import * as AppleAuthentication from "expo-apple-authentication"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import i18n, { setAppLocale, type AppLocale, SUPPORTED_LOCALES } from "./i18n"
import { apiFetch } from "./api"
import { isAppleWebSignInCanceled, signInWithAppleWeb } from "./apple-sign-in-web"
import { openInAppBrowser } from "./in-app-browser"
import {
  isOAuthCancelled,
  isSupabaseSiteUrlFallback,
  mapOAuthCallbackError,
  OAUTH_INCOMPLETE,
  parseAuthCallbackUrl,
} from "./oauth-callback"
import { getOAuthRedirectUri } from "./oauth-redirect"
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
  signInWithApple: () => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

function dismissOAuthBrowser() {
  try {
    const result = WebBrowser.dismissBrowser() as Promise<unknown> | undefined
    if (result && typeof result.catch === "function") void result.catch(() => undefined)
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [pinUnlocked, setPinUnlocked] = useState(false)
  const oauthErrorRef = useRef<string | null>(null)
  const oauthInFlightRef = useRef(false)

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

  const consumeOAuthCallback = useCallback(async (url: string): Promise<boolean> => {
    if (oauthInFlightRef.current) return false
    const { code, accessToken, refreshToken, error, errorDescription } = parseAuthCallbackUrl(url)
    if (error) {
      oauthErrorRef.current = mapOAuthCallbackError(error, errorDescription)
      return false
    }
    if (!code && !accessToken) return false
    dismissOAuthBrowser()
    oauthInFlightRef.current = true
    try {
      if (code) {
        const existing = await supabase.auth.getSession()
        if (existing.data.session?.access_token) return true
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code)
        if (exErr) {
          oauthErrorRef.current = exErr.message || "Could not complete sign-in. Try again."
          return false
        }
        return true
      }
      if (accessToken) {
        const { error: sErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? "",
        })
        if (sErr) {
          oauthErrorRef.current = sErr.message || "Could not complete sign-in. Try again."
          return false
        }
        return true
      }
      return false
    } finally {
      oauthInFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const linkSub = Linking.addEventListener("url", (event) => {
      void consumeOAuthCallback(event.url)
    })
    supabase.auth.getSession().then(async () => {
      const initialUrl = await Linking.getInitialURL()
      if (initialUrl) await consumeOAuthCallback(initialUrl)
      if (Platform.OS === "web" && typeof window !== "undefined") {
        await consumeOAuthCallback(window.location.href)
      }
      const latest = await supabase.auth.getSession()
      if (!mounted) return
      void applySessionUser(latest.data.session?.user ?? null).finally(() => {
        if (mounted) setLoading(false)
      })
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      void applySessionUser(session?.user ?? null)
    })
    return () => {
      mounted = false
      linkSub.remove()
      sub.subscription.unsubscribe()
    }
  }, [applySessionUser, consumeOAuthCallback])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const waitForOAuthSession = useCallback(async () => {
    const deadline = Date.now() + 3_000
    while (Date.now() < deadline) {
      const { data } = await supabase.auth.getSession()
      if (data.session?.access_token) return { error: null as string | null }
      if (oauthErrorRef.current) break
      await new Promise((r) => setTimeout(r, 100))
    }
    while (oauthInFlightRef.current && Date.now() < deadline + 2_000) {
      await new Promise((r) => setTimeout(r, 50))
    }
    const { data } = await supabase.auth.getSession()
    if (data.session?.access_token) return { error: null }
    const msg = oauthErrorRef.current
    oauthErrorRef.current = null
    if (msg && isOAuthCancelled(msg)) return { error: null }
    if (msg) return { error: msg }
    return { error: OAUTH_INCOMPLETE }
  }, [])

  const signInWithOAuth = useCallback(
    async (provider: "google" | "apple") => {
      oauthErrorRef.current = null
      const redirectTo = getOAuthRedirectUri()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}),
        },
      })
      if (error) return { error: error.message }
      const authUrl = data.url
      if (!authUrl) return { error: `Could not start ${provider} sign-in` }
      try {
        const u = new URL(authUrl)
        const redirectInAuth = u.searchParams.get("redirect_to") ?? u.searchParams.get("redirectTo")
        const decoded = redirectInAuth ? decodeURIComponent(redirectInAuth) : null
        if (isSupabaseSiteUrlFallback(decoded, redirectTo)) {
          return {
            error: `Supabase fell back to a website redirect (${decoded}). Add "${redirectTo}" to Auth → Redirect URLs.`,
          }
        }
      } catch {
        // ignore parse errors
      }
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.assign(authUrl)
        return { error: null }
      }
      await openInAppBrowser(authUrl)
      return waitForOAuthSession()
    },
    [waitForOAuthSession],
  )

  const signInWithGoogle = useCallback(() => signInWithOAuth("google"), [signInWithOAuth])

  const signInWithApple = useCallback(async () => {
    if (Platform.OS === "web") {
      try {
        const { idToken, fullName } = await signInWithAppleWeb()
        const { error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: idToken })
        if (error) return { error: error.message }
        if (fullName) {
          const parts = fullName.split(/\s+/).filter(Boolean)
          await supabase.auth.updateUser({
            data: {
              name: fullName,
              full_name: fullName,
              first_name: parts[0] ?? "",
              last_name: parts.slice(1).join(" "),
            },
          })
        }
        return { error: null }
      } catch (e) {
        if (isAppleWebSignInCanceled(e)) return { error: null }
        return { error: e instanceof Error ? e.message : "Unable to continue with Apple" }
      }
    }
    if (Platform.OS === "ios") {
      try {
        const available = await AppleAuthentication.isAvailableAsync()
        if (!available) return signInWithOAuth("apple")
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        })
        if (!credential.identityToken) return { error: "Apple sign-in did not return a token" }
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        })
        if (error) return { error: error.message }
        const givenName = credential.fullName?.givenName ?? ""
        const familyName = credential.fullName?.familyName ?? ""
        const name = [givenName, familyName].filter(Boolean).join(" ")
        if (name) {
          await supabase.auth.updateUser({
            data: { name, full_name: name, first_name: givenName, last_name: familyName },
          })
        }
        return { error: null }
      } catch (e: unknown) {
        const err = e as { code?: string }
        if (err?.code === "ERR_REQUEST_CANCELED") return { error: null }
        return { error: e instanceof Error ? e.message : "Unable to continue with Apple" }
      }
    }
    return signInWithOAuth("apple")
  }, [signInWithOAuth])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const check = await apiFetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (check.ok) {
      const body = (await check.json()) as { exists?: boolean }
      if (body.exists) return { error: "An account with this email already exists" }
    }
    const name = fullName.trim()
    const parts = name.split(/\s+/).filter(Boolean)
    const firstName = parts[0] ?? ""
    const lastName = parts.slice(1).join(" ")
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, full_name: name, first_name: firstName, last_name: lastName } },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const unlockPin = useCallback(() => setPinUnlocked(true), [])

  const value = useMemo(
    () => ({ user, profile, loading, pinUnlocked, unlockPin, signIn, signInWithGoogle, signInWithApple, signUp, signOut }),
    [user, profile, loading, pinUnlocked, unlockPin, signIn, signInWithGoogle, signInWithApple, signUp, signOut],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
