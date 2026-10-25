import { NextResponse, type NextRequest } from "next/server"
import { limitOrResponse } from "@/lib/rate-limit"
import { reportError } from "@/lib/error-report"

export const dynamic = "force-dynamic"

const SOURCES = ["mobile", "seller", "office"] as const

/** Crash and error reports from the apps. Public (a crash can happen before sign-in), so it is capped, limited and scrubbed. */
export async function POST(request: NextRequest) {
  const limited = await limitOrResponse(request, "client-errors", { limit: 10, windowSeconds: 60 })
  if (limited) return limited
  const text = await request.text()
  if (text.length > 8000) return NextResponse.json({ ok: false }, { status: 413 })
  let body: Record<string, unknown>
  try {
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const source = SOURCES.find((s) => s === body.source)
  if (!source || typeof body.message !== "string") return NextResponse.json({ ok: false }, { status: 400 })
  await reportError({
    source,
    message: body.message,
    stack: typeof body.stack === "string" ? body.stack : undefined,
    route: typeof body.route === "string" ? body.route.slice(0, 120) : undefined,
    release: typeof body.release === "string" ? body.release.slice(0, 40) : undefined,
    level: body.fatal ? "fatal" : "error",
  })
  return NextResponse.json({ ok: true })
}
