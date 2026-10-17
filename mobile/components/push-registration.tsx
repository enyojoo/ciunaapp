import { useEffect } from "react"
import { Platform } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import * as Notifications from "expo-notifications"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/toast-provider"
import { registerForPush, registerNotificationActions, routeForNotification, sendChatReply } from "@/lib/push-registration"

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
    void registerNotificationActions({
      reply: t("notifications.actionReply", { defaultValue: "Reply" }),
      send: t("notifications.actionSend", { defaultValue: "Send" }),
      placeholder: t("notifications.actionPlaceholder", { defaultValue: "Write a message" }),
      view: t("notifications.actionView", { defaultValue: "View" }),
    })
  }, [t])

  useEffect(() => {
    if (Platform.OS === "web") return
    const open = (data: unknown) => {
      const path = routeForNotification(data)
      if (path) router.push(path as never)
    }
    void Notifications.getLastNotificationResponseAsync().then((r) => {
      if (r) open(r.notification.request.content.data)
    })
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const data = r.notification.request.content.data as { orderId?: string } | undefined
      if (r.actionIdentifier === "reply" && "userText" in r && typeof (r as { userText?: string }).userText === "string") {
        void sendChatReply(String(data?.orderId || ""), (r as { userText: string }).userText).then((ok) => {
          showToast(ok ? t("notifications.replySent", { defaultValue: "Reply sent" }) : t("notifications.replyFailed", { defaultValue: "Could not send your reply. Open the chat to try again." }), ok ? "success" : "error", 4000)
        })
        return
      }
      open(r.notification.request.content.data)
    })
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
