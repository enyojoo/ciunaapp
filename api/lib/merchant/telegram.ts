import { createServerClient } from "@/lib/supabase"

export interface TelegramUpdate { message?: { chat: { id: number; type: string; username?: string }; from?: { username?: string }; text?: string } }

/** Handles `/start <token>` and `/stop`. Returns the reply to send, or null to ignore. Pure on top of the database. */
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<{ chatId: number; text: string } | null> {
  const msg = update.message
  if (!msg?.text || msg.chat.type !== "private") return null
  const chatId = msg.chat.id
  const db = createServerClient()
  const [cmd, arg] = msg.text.trim().split(/\s+/)
  if (cmd === "/stop") {
    await db.from("telegram_links").delete().eq("chat_id", chatId)
    return { chatId, text: "Alerts are off. Link again from Ciuna Seller settings whenever you like." }
  }
  if (cmd !== "/start") return { chatId, text: "Open Ciuna Seller, go to Settings, and choose Connect Telegram to link this chat." }
  if (!arg || !/^[0-9a-f-]{36}$/i.test(arg)) return { chatId, text: "Open Ciuna Seller, go to Settings, and choose Connect Telegram to link this chat." }
  const { data: tok } = await db.from("telegram_link_tokens").select("token,user_id,expires_at,used_at").eq("token", arg).maybeSingle()
  if (!tok || tok.used_at || new Date(tok.expires_at) < new Date()) return { chatId, text: "This link has expired. Create a new one in Ciuna Seller settings." }
  await db.from("telegram_links").delete().eq("chat_id", chatId) // one chat belongs to one account
  const up = await db.from("telegram_links").upsert({ user_id: tok.user_id, chat_id: chatId, username: msg.from?.username ?? msg.chat.username ?? null })
  if (up.error) return { chatId, text: "Could not link this chat. Try again." }
  await db.from("telegram_link_tokens").update({ used_at: new Date().toISOString() }).eq("token", tok.token)
  return { chatId, text: "Connected. You will get new orders and booking requests here." }
}
