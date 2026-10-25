import { pingHeartbeat } from "@/lib/heartbeat"
import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { expireStaleTransfers, sendBookingReminders, sendOrderNotifications, sendSlotAlerts, sendTransferNotifications } from "@/lib/push-events"

export const maxDuration = 60

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET || ""
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(request.headers.get("authorization") || "")
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    // Expire first so a transfer that just timed out is cancelled before anything else looks at it.
    const expired = await expireStaleTransfers()
    const [orders, transfers, reminders, slots] = await Promise.all([sendOrderNotifications(), sendTransferNotifications(), sendBookingReminders(), sendSlotAlerts()])
    await pingHeartbeat("order-notifications")
    return NextResponse.json({ expired, orders, transfers, reminders, slots })
  } catch (e) {
    console.error("order-notifications cron failed", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Job failed; it is safe to retry." }, { status: 503 })
  }
}
export const GET = handle
export const POST = handle
