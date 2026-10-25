import { randomUUID } from "node:crypto"

/**
 * Error reporting without an SDK: events go to Sentry's envelope endpoint when SENTRY_DSN is set, and to a structured
 * log line either way (Vercel logs). Personal and secret data is removed before anything leaves the process.
 */

const PATTERNS: [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [token]"],
  [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*/g, "[jwt]"],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]"],
  [/\b(?:\d[ -]?){13,19}\b/g, "[number]"],
  [/\+?\d[\d\s().-]{8,}\d/g, "[phone]"],
  [/(api[_-]?key|secret|token|password|authorization)(["']?\s*[:=]\s*["']?)[^\s"',}]+/gi, "$1$2[redacted]"],
]

export function scrub(text: string): string {
  return PATTERNS.reduce((s, [re, to]) => s.replace(re, to), text)
}

export type ErrorEvent = {
  source: "api" | "mobile" | "seller" | "office"
  message: string
  stack?: string
  route?: string
  requestId?: string
  release?: string
  level?: "error" | "warning" | "fatal"
}

function envelope(dsn: URL, e: ErrorEvent) {
  const projectId = dsn.pathname.replace(/^\//, "")
  const eventId = randomUUID().replace(/-/g, "")
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: e.source === "mobile" ? "javascript" : "node",
    level: e.level || "error",
    release: e.release,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    tags: { source: e.source, route: e.route, request_id: e.requestId },
    exception: { values: [{ type: "Error", value: e.message, ...(e.stack ? { stacktrace: { frames: e.stack.split("\n").slice(0, 30).map((f) => ({ function: f.trim() })) } } : {}) }] },
  }
  const header = JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn: dsn.toString() })
  const item = JSON.stringify({ type: "event" })
  return {
    url: `${dsn.protocol}//${dsn.host}/api/${projectId}/envelope/?sentry_key=${dsn.username}&sentry_version=7`,
    body: `${header}\n${item}\n${JSON.stringify(event)}`,
  }
}

export async function reportError(e: ErrorEvent): Promise<void> {
  const clean: ErrorEvent = { ...e, message: scrub(e.message).slice(0, 500), stack: e.stack ? scrub(e.stack).slice(0, 4000) : undefined }
  console.error("ERROR_REPORT", JSON.stringify({ source: clean.source, route: clean.route, requestId: clean.requestId, message: clean.message }))
  const raw = process.env.SENTRY_DSN
  if (!raw) return
  try {
    const { url, body } = envelope(new URL(raw), clean)
    await fetch(url, { method: "POST", body, headers: { "Content-Type": "text/plain;charset=UTF-8" }, signal: AbortSignal.timeout(3000) })
  } catch {
    // reporting must never take the request down
  }
}
