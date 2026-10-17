import { useEffect } from "react"
import { Platform } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import * as Notifications from "expo-notifications"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/toast-provider"
import { registerForPush, routeForNotification } from "@/lib/push-registration"

/** Registers this phone for notifications once signed in, and opens the right screen when one is tapped. Renders nothing. */
export function PushRegistration() {
  const { user } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const { t } = useTranslation("app")

  useEffect(() => {
    if (user?.id) void registerForPush()
  }, [user?.id])

  useEffect(() => {
    if (Platform.OS === "web") return
    const open = (data: unknown) => {
      const path = routeForNotification(data)
      if (path) router.push(path as never)
    }
    void Notifications.getLastNotificationResponseAsync().then((r) => {
      if (r) open(r.notification.request.content.data)
    })
    const sub = Notifications.addNotificationResponseReceivedListener((r) => open(r.notification.request.content.data))
    const inApp = Notifications.addNotificationReceivedListener((n) => {
      const c = n.request.content
      const path = routeForNotification(c.data)
      const text = [c.title, c.body].filter(Boolean).join(": ")
      if (text) showToast(text, "info", 5000, path ? { label: t("a11y.open", { defaultValue: "Open" }), onPress: () => router.push(path as never) } : undefined)
    })
    return () => {
      sub.remove()
      inApp.remove()
    }
  }, [router, showToast, t])

  return null
}
