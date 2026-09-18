import { Platform } from "react-native"
import Constants from "expo-constants"
import { makeRedirectUri } from "expo-auth-session"
import { isExpoGo } from "./expo-go"

/** Must match Supabase Auth → Site URL so the allowlist accepts this redirect. */
export const SITE_AUTH_CALLBACK = "https://app.ciuna.com/auth/callback"
const NATIVE_SCHEME_CALLBACK = "ciuna://auth/callback"

/**
 * Deep link that actually opens this binary.
 * Expo Go cannot claim `ciuna://` (Easner uses a store/dev build, so `easner://` works there).
 */
export function getNativeOAuthDeepLink(): string {
  if (isExpoGo) {
    const linkingUri = (Constants.linkingUri ?? "").replace(/\/+$/, "")
    if (linkingUri.startsWith("exp://")) {
      const base = linkingUri.replace(/\/--$/, "")
      return `${base}/--/auth/callback`
    }
    const host = Constants.expoConfig?.hostUri
    if (host) return `exp://${host}/--/auth/callback`
  }
  return makeRedirectUri({
    scheme: "ciuna",
    path: "auth/callback",
    native: NATIVE_SCHEME_CALLBACK,
  })
}

/** Site URL + app_redirect, for when Supabase will not allow exp:// or ciuna://. */
export function getWebsiteOAuthBounceUri(): string {
  return `${SITE_AUTH_CALLBACK}?app_redirect=${encodeURIComponent(getNativeOAuthDeepLink())}`
}

/**
 * OAuth return URL for Supabase `signInWithOAuth`.
 *
 * Store/dev builds: `ciuna://auth/callback` (same as Easner’s `easner://`).
 * Expo Go cannot claim that scheme, so we return `exp://…/--/auth/callback`
 * (allow `exp://**` in Supabase Auth → Redirect URLs).
 */
export function getOAuthRedirectUri(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`
  }
  return getNativeOAuthDeepLink()
}
