import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { runMoneyJobs } from "@/lib/merchant/money"

export const maxDuration = 60

/** Releases earnings past their hold and backfills any fulfilled order missing an earning. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET || ""
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(request.headers.get("authorization") || "")
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    return NextResponse.json(await runMoneyJobs())
  } catch (e) {
    console.error("merchant-money cron failed", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Job failed; it is safe to retry." }, { status: 503 })
  }
}
export const GET = handle
export const POST = handle
