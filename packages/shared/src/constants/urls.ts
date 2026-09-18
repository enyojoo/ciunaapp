/**
 * Canonical production hosts.
 * Local defaults: web 3000, office 3001, api 3002, Expo 8081.
 *
 * Env split (names only — never commit secrets):
 * - All clients (web, office, mobile): NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_URL,
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *   (Expo: EXPO_PUBLIC_API_URL / EXPO_PUBLIC_APP_URL / EXPO_PUBLIC_SUPABASE_*)
 * - api only: SUPABASE_SERVICE_ROLE_KEY, SES_REGION, AWS_ACCESS_KEY_ID,
 *   AWS_SECRET_ACCESS_KEY, SES_FROM_EMAIL, SES_FROM_NAME, SES_REPLY_TO,
 *   CRON_SECRET, WEBHOOK_SECRET, JWT_SECRET, ADMIN_TRANSACTION_NOTIFICATION_EMAIL
 * - Never put service role or SES/AWS keys on web, office, or mobile.
 */
export const APP_URLS = {
  website: "https://www.ciuna.com",
  app: "https://app.ciuna.com",
  api: "https://api.ciuna.com",
  office: "https://bk.ciuna.com",
} as const

export const LOCAL_URLS = {
  web: "http://localhost:3000",
  office: "http://localhost:3001",
  api: "http://localhost:3002",
  expo: "http://localhost:8081",
} as const

export function resolveApiUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.API_URL
  if (fromEnv) return fromEnv.replace(/\/+$/, "")
  return process.env.NODE_ENV === "production" ? APP_URLS.api : LOCAL_URLS.api
}

export function resolveAppUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.EXPO_PUBLIC_APP_URL
  if (fromEnv) return fromEnv.replace(/\/+$/, "")
  return process.env.NODE_ENV === "production" ? APP_URLS.app : LOCAL_URLS.web
}

export function resolveOfficeUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_OFFICE_URL
  if (fromEnv) return fromEnv.replace(/\/+$/, "")
  return process.env.NODE_ENV === "production" ? APP_URLS.office : LOCAL_URLS.office
}

export function joinApiPath(path: string, base = resolveApiUrl()): string {
  if (path.startsWith("http")) return path
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base.replace(/\/+$/, "")}${p}`
}
