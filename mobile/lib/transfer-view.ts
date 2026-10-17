import { statusTone } from "./transactions"

export type StepState = "done" | "current" | "upcoming" | "failed" | "stopped"
export type StepKey = "created" | "payment" | "sent" | "delivered" | "refund"
export type TransferStep = { key: StepKey; variant: string; state: StepState; time?: string | null }

type Tone = ReturnType<typeof statusTone>

/**
 * The timeline of one transfer, from what the record tells us. Times are shown only where the record has one: created
 * and delivered (completed). The steps in between carry no time until the API records them.
 */
export function transferSteps(tone: Tone, createdAt?: string | null, completedAt?: string | null, events?: { status: string; created_at: string }[]): TransferStep[] {
  const at = (...statuses: string[]) => (events || []).find((e) => statuses.includes(e.status))?.created_at ?? null
  const paidAt = at("processing", "converting", "converted")
  const doneAt = at("completed", "deposited") || completedAt
  const refundedAt = at("refunded") || completedAt
  const created: TransferStep = { key: "created", variant: "default", state: "done", time: createdAt }
  switch (tone) {
    case "pending":
      return [created, { key: "payment", variant: "waiting", state: "current" }, { key: "sent", variant: "after", state: "upcoming" }, { key: "delivered", variant: "default", state: "upcoming" }]
    case "processing":
      return [created, { key: "payment", variant: "received", state: "done", time: paidAt }, { key: "sent", variant: "sending", state: "current" }, { key: "delivered", variant: "default", state: "upcoming" }]
    case "completed":
      return [created, { key: "payment", variant: "received", state: "done", time: paidAt }, { key: "sent", variant: "sent", state: "done" }, { key: "delivered", variant: "default", state: "done", time: doneAt }]
    case "failed":
      return [created, { key: "payment", variant: "received", state: "done", time: paidAt }, { key: "sent", variant: "failed", state: "failed", time: at("failed") }, { key: "refund", variant: "onItsWay", state: "current" }]
    case "refunded":
      return [created, { key: "payment", variant: "received", state: "done", time: paidAt }, { key: "sent", variant: "failed", state: "failed", time: at("failed") }, { key: "refund", variant: "done", state: "done", time: refundedAt }]
    case "cancelled":
    default:
      return [created, { key: "payment", variant: "notReceived", state: "stopped" }, { key: "sent", variant: "notSent", state: "upcoming" }, { key: "delivered", variant: "notSent", state: "upcoming" }]
  }
}

/** Fee as a share of the amount sent, e.g. "1%"; empty when it cannot be worked out. */
export function feePercent(fee: number, sent: number): string {
  if (!(sent > 0) || !(fee > 0)) return ""
  const p = (fee / sent) * 100
  return `${Number.isInteger(p) ? p : p.toFixed(p < 1 ? 2 : 1).replace(/\.?0+$/, "")}%`
}

/** Exchange rate with enough digits to be exact for small-value currencies. */
export function formatRate(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return ""
  if (rate >= 100) return rate.toFixed(2)
  if (rate >= 1) return rate.toFixed(4).replace(/\.?0+$/, "")
  return rate.toPrecision(3).replace(/\.?0+$/, "")
}
