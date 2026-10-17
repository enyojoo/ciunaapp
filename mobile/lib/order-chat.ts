import { useCallback, useEffect, useState } from "react"
import { AppState } from "react-native"
import { authJson } from "./social-api"

export const CHAT_MAX = 2000

export type ChatMessage = {
  id: number
  senderKind: "customer" | "merchant"
  body: string
  language: string
  createdAt: string
  readAt: string | null
}

export type ChatThread = { messages: ChatMessage[]; closed: boolean; available: boolean; unavailable?: boolean }

/** Unread seller messages for the signed-in customer, overall and per order. Polls gently; failures are silent. */
export function useChatUnread(orderId?: string | null, enabled = true) {
  const [orders, setOrders] = useState<Record<string, number>>({})
  const [count, setCount] = useState(0)
  const [unavailable, setUnavailable] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await authJson<{ count: number; unavailable?: boolean; orders: { orderId: string; unread: number }[] }>("/api/hub/messages/unread")
      const map: Record<string, number> = {}
      for (const o of res.orders || []) map[o.orderId] = o.unread
      setOrders(map)
      setCount(res.count || 0)
      setUnavailable(Boolean(res.unavailable))
    } catch {
      /* the dot is a nicety; never surface an error for it */
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void load()
    const timer = setInterval(() => void load(), 20_000)
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void load()
    })
    return () => {
      clearInterval(timer)
      sub.remove()
    }
  }, [enabled, load])

  return { count, unavailable, unread: orderId ? orders[orderId] || 0 : 0, byOrder: orders, reload: load }
}
