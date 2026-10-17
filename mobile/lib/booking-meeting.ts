export type Meeting = { url: string | null; instructions: string | null }

/**
 * The meeting link and notes the expert added to a booking. They arrive as the latest customer-visible event of kind
 * "meeting_link", whose message is the link on the first line and any notes after it. Only https links are used.
 */
export function meetingFromEvents(events: { kind: string; message?: string | null; created_at?: string }[] | undefined | null): Meeting {
  const e = (events || []).filter((x) => x.kind === "meeting_link").sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))[0]
  const lines = String(e?.message || "").split("\n").map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return { url: null, instructions: null }
  const first = lines[0]
  const url = /^https:\/\/[^\s]+$/i.test(first) ? first : null
  const rest = (url ? lines.slice(1) : lines).join("\n")
  return { url, instructions: rest || null }
}
