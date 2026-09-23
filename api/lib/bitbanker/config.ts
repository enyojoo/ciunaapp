export type BitbankerEnvironment = "sandbox" | "production"

export function bitbankerEnvironment(): BitbankerEnvironment {
  const raw = String(process.env.BITBANKER_ENVIRONMENT || "sandbox").trim().toLowerCase()
  return raw === "production" ? "production" : "sandbox"
}

export function bitbankerApiBaseUrl(): string {
  const fromEnv = process.env.BITBANKER_API_BASE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  return bitbankerEnvironment() === "production"
    ? "https://api.aws.bitbanker.org/latest"
    : "https://api.aws.dev.bitbanker.org/latest"
}

export function bitbankerCredentials(): { apiKey: string; apiSecret: string } {
  const apiKey = process.env.BITBANKER_API_KEY?.trim()
  const apiSecret = process.env.BITBANKER_API_SECRET?.trim()
  if (!apiKey || !apiSecret) {
    throw new Error("Bitbanker is not configured (BITBANKER_API_KEY / BITBANKER_API_SECRET missing)")
  }
  return { apiKey, apiSecret }
}

export function isBitbankerConfigured(): boolean {
  return Boolean(process.env.BITBANKER_API_KEY?.trim() && process.env.BITBANKER_API_SECRET?.trim())
}
