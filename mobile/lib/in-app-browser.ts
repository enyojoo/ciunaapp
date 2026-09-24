import { Platform } from "react-native"
import * as WebBrowser from "expo-web-browser"
import { colors } from "@/lib/theme"

/** SFSafariViewController / Chrome Custom Tabs chrome. */
const OPTIONS = {
  controlsColor: colors.text,
  toolbarColor: colors.paper,
  enableBarCollapsing: true,
  showTitle: true,
} as const

/**
 * In-app browser for Legal and other hosted pages.
 * iOS: SFSafariViewController. Android: Chrome Custom Tab (`createTask: false`
 * so OAuth/deep links stay in the app task). Web should use `useExternalLink`.
 */
export async function openInAppBrowser(url: string) {
  return WebBrowser.openBrowserAsync(url, {
    ...OPTIONS,
    ...(Platform.OS === "android" ? { createTask: false } : {}),
  })
}
