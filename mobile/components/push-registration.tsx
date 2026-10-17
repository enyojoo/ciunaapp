import { useEffect } from "react"
import { Platform } from "react-native"
import { useRouter } from "expo-router"
import * as Notifications from "expo-notifications"
import { useAuth } from "@/lib/auth-context"
import { registerForPush, routeForNotification } from "@/lib/push-registration"

/** Registers this phone for notifications once signed in, and opens the right screen when one is tapped. Renders nothing. */
export function PushRegistration() {
  const { user } = useAuth()
  const router = useRouter()

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
    return () => sub.remove()
  }, [router])

  return null
}
