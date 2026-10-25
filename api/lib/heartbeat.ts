/**
 * Dead-man ping for scheduled jobs. When a job finishes, call `pingHeartbeat("name")`: it requests HEARTBEAT_URL_NAME
 * (for example a Better Stack or Healthchecks.io URL). The monitor alerts when the ping stops arriving, which catches a
 * cron that was never scheduled, is failing, or has stalled. Unset means no ping. Never throws.
 */
export async function pingHeartbeat(name: string): Promise<void> {
  const url = process.env[`HEARTBEAT_URL_${name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`]
  if (!url) return
  try {
    await fetch(url, { method: "GET", signal: AbortSignal.timeout(3000) })
  } catch {
    // a missed ping is itself the alert
  }
}
