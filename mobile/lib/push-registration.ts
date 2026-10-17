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

/** Buttons under a chat notification: Reply (typed on the lock screen, sent without opening the app) and View. */
export async function registerNotificationActions(labels: { reply: string; send: string; placeholder: string; view: string }): Promise<void> {
  if (Platform.OS === "web") return
  try {
    await Notifications.setNotificationCategoryAsync("chat", [
      { identifier: "reply", buttonTitle: labels.reply, textInput: { submitButtonTitle: labels.send, placeholder: labels.placeholder }, options: { opensAppToForeground: false } },
      { identifier: "view", buttonTitle: labels.view, options: { opensAppToForeground: true } },
    ])
  } catch {
    // Buttons are an extra; a tap still opens the chat.
  }
}

/** Sends a reply typed on the lock screen to the seller. Returns whether it was sent. */
export async function sendChatReply(orderId: string, text: string): Promise<boolean> {
  const body = text.trim().slice(0, 2000)
  if (!body || !/^[0-9a-f-]{36}$/i.test(orderId)) return false
  try {
    const res = await fetchWithAuth(`/api/hub/orders/${orderId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) })
    return res.ok
  } catch {
    return false
  }
}

/** Where a tapped notification should go, or null to just open the app. */
export function routeForNotification(data: unknown): string | null {
  const d = (data ?? {}) as { type?: unknown; requestId?: unknown; orderId?: unknown; transactionId?: unknown }
  const uuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v)
  if (d.type === "support" && uuid(d.requestId)) return `/support/${d.requestId}`
  if (d.type === "order" && uuid(d.orderId)) return `/orders/${d.orderId}`
  if (d.type === "chat" && uuid(d.orderId)) return `/orders/${d.orderId}/chat`
  if (d.type === "expert" && typeof (d as { slug?: unknown }).slug === "string" && /^[a-z0-9-]{1,80}$/i.test((d as { slug: string }).slug)) return `/experts/${(d as { slug: string }).slug}`
  if (d.type === "transfer" && typeof d.transactionId === "string" && /^[A-Za-z0-9-]{4,40}$/.test(d.transactionId)) return `/orders/${d.transactionId.toLowerCase()}`
  return null
}
