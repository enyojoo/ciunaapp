import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { sendBookingReminders, sendOrderNotifications, sendTransferNotifications } from "@/lib/push-events"

export const maxDuration = 60

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET || ""
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(request.headers.get("authorization") || "")
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const [orders, transfers, reminders] = await Promise.all([sendOrderNotifications(), sendTransferNotifications(), sendBookingReminders()])
    return NextResponse.json({ orders, transfers, reminders })
  } catch (e) {
    console.error("order-notifications cron failed", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Job failed; it is safe to retry." }, { status: 503 })
  }
}
export const GET = handle
export const POST = handle
