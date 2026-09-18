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

export function isSupabaseSiteUrlFallback(redirectInAuthUrl: string | null | undefined, requested: string): boolean {
  if (!redirectInAuthUrl || redirectInAuthUrl === requested) return false
  return !/^https?:\/\//i.test(requested) && /^https?:\/\//i.test(redirectInAuthUrl)
}
