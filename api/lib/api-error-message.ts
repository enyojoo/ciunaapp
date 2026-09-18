import type { TFunction } from "i18next"

/**
 * Prefer `errorCode` → `errors.codes.<code>` in app.json when present; else server `error`;
 * else localized `fallbackKey` (default errors.generic).
 */
export function apiErrorMessage(
  body: { error?: string; errorCode?: string } | null | undefined,
  t: TFunction<"app">,
  fallbackKey: "errors.generic" | "errors.loadFailed" = "errors.generic",
): string {
  const code = body?.errorCode
  if (code) {
    const key = `errors.codes.${code}` as const
    const out = t(key)
    if (out !== key) return out
  }
  if (typeof body?.error === "string" && body.error.trim()) return body.error
  return t(fallbackKey)
}
