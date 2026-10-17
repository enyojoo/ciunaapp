import Constants from "expo-constants"

/** Public address of the app (Expo web), used for links people share. */
export function appOrigin(): string {
  const o = (Constants.expoConfig?.extra as { router?: { origin?: string } } | undefined)?.router?.origin
  return (o || "https://app.ciuna.com").replace(/\/+$/, "")
}

/** Link to a store page. The slug is encoded so a name can never change the path. */
export function storeLink(line: string, slug: string): string {
  return `${appOrigin()}/hub/${encodeURIComponent(line)}/v/${encodeURIComponent(slug)}`
}

/** Link to an expert's profile. */
export function expertLink(slug: string): string {
  return `${appOrigin()}/experts/${encodeURIComponent(slug)}`
}
