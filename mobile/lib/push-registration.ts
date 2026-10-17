import { Platform } from "react-native"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import Constants from "expo-constants"
import { fetchWithAuth } from "./api"

let registeredToken: string | null = null

Notifications.setNotificationHandler({
  // In the foreground the app shows its own toast (components/push-registration.tsx), not the system banner.
  handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
})

/** Ask for permission (once) and give the server this device's token. Native phones only; never throws. */
export async function registerForPush(): Promise<void> {
  try {
    if (Platform.OS === "web" || !Device.isDevice) return
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", { name: "Ciuna", importance: Notifications.AndroidImportance.DEFAULT })
    }
    const granted = (p: unknown) => (p as { granted?: boolean }).granted === true
    if (!granted(await Notifications.getPermissionsAsync()) && !granted(await Notifications.requestPermissionsAsync())) return
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
    registeredToken = token
    await fetchWithAuth("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform: Platform.OS }),
    })
  } catch {
    // Notifications are optional; the app works without them.
  }
}

/** Stop notifications for this device. Call before the session ends so the request is still authorised. */
export async function unregisterPush(): Promise<void> {
  const token = registeredToken
  if (!token) return
  registeredToken = null
  try {
    await fetchWithAuth("/api/push/register", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
  } catch {
    // Best effort.
  }
}

/** Where a tapped notification should go, or null to just open the app. */
export function routeForNotification(data: unknown): string | null {
  const d = (data ?? {}) as { type?: unknown; requestId?: unknown; orderId?: unknown }
  const uuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v)
  if (d.type === "support" && uuid(d.requestId)) return `/support/${d.requestId}`
  if (d.type === "order" && uuid(d.orderId)) return `/orders/${d.orderId}`
  if (d.type === "chat" && uuid(d.orderId)) return `/orders/${d.orderId}/chat`
  return null
}
