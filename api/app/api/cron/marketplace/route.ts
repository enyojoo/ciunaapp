import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { runMarketplaceWorker } from "@/lib/marketplace/worker"
export const maxDuration = 60
export async function POST(request: NextRequest) {
  const expected = Buffer.from(`Bearer ${process.env.MARKETPLACE_WORKER_SECRET || ""}`),
    actual = Buffer.from(request.headers.get("authorization") || "")
  if (
    !process.env.MARKETPLACE_WORKER_SECRET ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    return NextResponse.json(await runMarketplaceWorker())
  } catch {
    return NextResponse.json({ error: "Worker failed; pending jobs remain retryable." }, { status: 503 })
  }
}
