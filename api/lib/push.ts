import { createServerClient } from "@/lib/supabase"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
const TOKEN = /^Expo(?:nent)?PushToken\[[A-Za-z0-9_-]{8,}\]$/

export type PushPayload = { title: string; body: string; data?: Record<string, unknown> }
export type PushMessage = { to: string; title: string; body: string; sound: "default"; data: Record<string, unknown> }

export const isExpoPushToken = (t: unknown): t is string => typeof t === "string" && TOKEN.test(t)

/** One message per device. Title and body are trimmed to what a lock screen shows. */
export function buildMessages(tokens: string[], payload: PushPayload): PushMessage[] {
  return tokens.map((to) => ({ to, title: payload.title.slice(0, 80), body: payload.body.slice(0, 240), sound: "default", data: payload.data ?? {} }))
}

/** Expo answers with one ticket per message, in order. Tokens it says are no longer registered should be deleted. */
export function deadTokens(tokens: string[], tickets: Array<{ status?: string; details?: { error?: string } }>): string[] {
  return tokens.filter((_, i) => tickets[i]?.status === "error" && tickets[i]?.details?.error === "DeviceNotRegistered")
}

export const chunk = <T,>(items: T[], size: number): T[][] => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size))

/**
 * Sends a notification to every enabled device of a user. Best effort: it never throws, so an action such as a support
 * reply is not undone by a push failure.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  try {
    const db = createServerClient()
    const { data, error } = await db.from("push_tokens").select("token").eq("user_id", userId).eq("enabled", true)
    if (error || !data?.length) return 0
    const tokens = (data as { token: string }[]).map((r) => r.token)
    let sent = 0
    for (const group of chunk(tokens, 100)) {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}) },
        body: JSON.stringify(buildMessages(group, payload)),
      })
      if (!res.ok) continue
      const body = (await res.json().catch(() => null)) as { data?: Array<{ status?: string; details?: { error?: string } }> } | null
      const tickets = body?.data ?? []
      sent += tickets.filter((t) => t.status === "ok").length
      const dead = deadTokens(group, tickets)
      if (dead.length) await db.from("push_tokens").delete().in("token", dead)
    }
    return sent
  } catch (e) {
    console.error("push send failed", (e as Error)?.message)
    return 0
  }
}
