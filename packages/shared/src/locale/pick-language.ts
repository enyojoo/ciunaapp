export type DeviceLocale = { languageCode?: string | null; languageTag?: string | null }

/**
 * The first of the device's preferred languages that the app supports, or `fallback`. Regional and script variants map to
 * their language: zh-Hans-CN and zh-Hant-TW give "zh", pt-BR and pt-PT give "pt", fr-CA gives "fr".
 */
export function pickSupportedLanguage<T extends string>(locales: readonly DeviceLocale[], supported: readonly T[], fallback: T): T {
  for (const l of locales) {
    const code = String(l.languageCode || l.languageTag?.split(/[-_]/)[0] || "").toLowerCase()
    const hit = supported.find((s) => s === code)
    if (hit) return hit
  }
  return fallback
}
