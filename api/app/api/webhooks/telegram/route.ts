import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { handleTelegramUpdate } from "@/lib/merchant/telegram"

/** Telegram bot webhook. Register with `secret_token` = TELEGRAM_WEBHOOK_SECRET; Telegram echoes it in a header. */
export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || ""
  const given = request.headers.get("x-telegram-bot-api-secret-token") || ""
  const a = Buffer.from(secret), b = Buffer.from(given)
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const reply = await handleTelegramUpdate(await request.json())
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (reply && token) await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: reply.chatId, text: reply.text }) })
  } catch (e) {
    console.error("telegram webhook failed", e instanceof Error ? e.message : e)
  }
  return NextResponse.json({ ok: true }) // always 200 so Telegram does not retry forever
}
