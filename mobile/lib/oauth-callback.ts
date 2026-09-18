import * as Linking from "expo-linking"

export const OAUTH_CANCELLED = "Sign-in was cancelled."
export const OAUTH_INCOMPLETE = "Sign-in did not finish. Try again, or continue with email."

export function mapOAuthCallbackError(error: string | null, errorDescription: string | null): string {
  if (error === "access_denied") return OAUTH_CANCELLED
  const desc = (errorDescription ?? "").trim()
  if (/authorization attempt failed/i.test(desc)) {
    return "Could not complete sign-in. Try another account, or continue with email."
  }
  if (error === "disallowed_useragent" || /disallowed_useragent/i.test(desc)) {
    return "Sign-in is not available in this browser. Try again or continue with email."
  }
  if (desc) return desc
  return "Sign-in failed. Please try again."
}

export function isOAuthCancelled(message: string | null): boolean {
  if (!message) return true
  const lower = message.toLowerCase()
  return (
    message === OAUTH_CANCELLED ||
    lower.includes("cancel") ||
    lower.includes("dismiss") ||
    lower === "access_denied"
  )
}

export function parseAuthCallbackUrl(url: string): {
  code: string | null
  accessToken: string | null
  refreshToken: string | null
  error: string | null
  errorDescription: string | null
} {
  const tryParse = (raw: string) => (Linking.parse(raw).queryParams ?? {}) as Record<string, unknown>
  const qp1 = tryParse(url)
  let qp2: Record<string, unknown> = {}
  try {
    const hashIdx = url.indexOf("#")
    if (hashIdx >= 0) {
      qp2 = tryParse(`ciuna://auth/callback?${url.slice(hashIdx + 1)}`)
    }
  } catch {
    qp2 = {}
  }
  const qp = { ...qp1, ...qp2 }
  const str = (v: unknown) => (typeof v === "string" ? v : null)
  return {
    code: str(qp.code),
    accessToken: str(qp.access_token),
    refreshToken: str(qp.refresh_token),
    error: str(qp.error),
    errorDescription: str(qp.error_description) ?? str(qp.errorDescription),
  }
}

function decodeRedirect(value: string): string {
  try {
    return decodeURIComponent(value).replace(/\/+$/, "")
  } catch {
    return value.replace(/\/+$/, "")
  }
}

export function isSupabaseSiteUrlFallback(redirectInAuthUrl: string | null | undefined, requested: string): boolean {
  if (!redirectInAuthUrl || redirectInAuthUrl === requested) return false
  return !/^https?:\/\//i.test(requested) && /^https?:\/\//i.test(redirectInAuthUrl)
}

/** True when Supabase kept the redirect we asked for (query order / encoding ignored). */
export function oauthRedirectsMatch(actual: string | null | undefined, requested: string): boolean {
  if (!actual) return false
  if (decodeRedirect(actual) === decodeRedirect(requested)) return true
  try {
    const a = new URL(decodeRedirect(actual))
    const b = new URL(decodeRedirect(requested))
    if (a.origin !== b.origin) return false
    if (a.pathname.replace(/\/+$/, "") !== b.pathname.replace(/\/+$/, "")) return false
    const want = b.searchParams.get("app_redirect")
    if (!want) return true
    return a.searchParams.get("app_redirect") === want
  } catch {
    return false
  }
}

const NATIVE_OAUTH_SCHEMES = /^(ciuna|exp):\/\//i

/** Forward a website OAuth callback to Expo Go / the native app without exchanging the code. */
export function bounceNativeOAuthRedirect(href: string): boolean {
  if (typeof window === "undefined") return false
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return false
  }
  const redirect = url.searchParams.get("app_redirect")
  if (!redirect || !NATIVE_OAUTH_SCHEMES.test(redirect)) return false
  url.searchParams.delete("app_redirect")
  const leftover = url.searchParams.toString()
  const dest = leftover ? `${redirect}${redirect.includes("?") ? "&" : "?"}${leftover}` : redirect
  window.location.replace(`${dest}${url.hash}`)
  return true
}
