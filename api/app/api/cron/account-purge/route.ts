import { pingHeartbeat } from "@/lib/heartbeat"
import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { runPurge } from "@/lib/account-deletion"

export const maxDuration = 60

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET || ""
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(request.headers.get("authorization") || "")
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const result = await runPurge(20)
    await pingHeartbeat("account-purge")
    return NextResponse.json(result)
  } catch (e) {
    console.error("account-purge cron failed", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Job failed; it is safe to retry." }, { status: 503 })
  }
}
export const GET = handle
export const POST = handle
