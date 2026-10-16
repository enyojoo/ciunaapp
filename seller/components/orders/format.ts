import { enUS, ru, fr, es, zhCN, pt } from "date-fns/locale"
import type { Locale as DateLocale } from "date-fns"

export interface SellerOrderItem { id: string; title: string; quantity: number; unitPrice: number }
export interface SellerOrder {
  id: string
  publicId: string
  line: string
  status: "new" | "accepted" | "preparing" | "completed" | "cancelled"
  paymentState: string
  fulfillmentMode: "delivery" | "pickup" | "digital" | "online_appointment" | "in_person_appointment" | string
  createdAt: string
  dueAt: string | null
  overdue: boolean
  title?: string
  items: SellerOrderItem[]
  totals: { currency: string; subtotal: number; deliveryFee: number } | null
  customer: { name: string | null; phone: string | null; email: string | null }
  delivery: { address: string | null; pickupLocation: string | null; pickupHours: string | null }
  note: string | null
  slot: { start: string; end?: string; timezone?: string } | null
  digitalContent: string | null
  actions: Array<"accept" | "start" | "fulfill" | "reject">
  exception: string | null
}
export interface SellerOrderEvent { id: string; kind: string; created_at: string; message: string | null }
export type OrderTab = "new" | "active" | "done" | "cancelled"

const DATE_LOCALES: Record<string, DateLocale> = { en: enUS, ru, fr, es, zh: zhCN, pt }
export const dateLocale = (locale: string): DateLocale => DATE_LOCALES[locale] ?? enUS

export const STATUS_LABEL_KEY: Record<SellerOrder["status"], string> = {
  new: "orders.status.new",
  accepted: "orders.status.accepted",
  preparing: "orders.status.preparing",
  completed: "orders.status.completed",
  cancelled: "orders.status.cancelled",
}

/** "2 × Jollof rice, +1 more" */
export function itemsSummary(items: SellerOrderItem[], t: (k: string, v?: Record<string, string | number>) => string): string {
  if (!items.length) return ""
  const first = `${items[0].quantity} × ${items[0].title}`
  const more = items.length - 1
  return more > 0 ? `${first}, ${t("orders.moreItems", { count: more })}` : first
}

export function orderTotal(o: Pick<SellerOrder, "totals">): number {
  return o.totals ? Number(o.totals.subtotal || 0) + Number(o.totals.deliveryFee || 0) : 0
}

/** Icon-free kind used for the chip label: delivery | pickup | digital | booking. */
export function fulfilmentKind(mode: string): "delivery" | "pickup" | "digital" | "booking" {
  if (mode === "pickup") return "pickup"
  if (mode === "digital") return "digital"
  if (mode === "online_appointment" || mode === "in_person_appointment") return "booking"
  return "delivery"
}

/** Whole minutes until due; negative when overdue. */
export function minutesUntil(dueAt: string, now = Date.now()): number {
  return Math.floor((new Date(dueAt).getTime() - now) / 60_000)
}

/** "1 h 5 min" / "12 min" style parts; the caller formats with i18n. */
export function splitDuration(totalMinutes: number): { hours: number; minutes: number } {
  const abs = Math.abs(totalMinutes)
  return { hours: Math.floor(abs / 60), minutes: abs % 60 }
}

/** Primary one-tap action shown on a list card, only if the API allows it. */
export function primaryCardAction(o: Pick<SellerOrder, "status" | "actions">): "accept" | "start" | null {
  if (o.status === "new" && o.actions.includes("accept")) return "accept"
  if (o.status === "accepted" && o.actions.includes("start")) return "start"
  return null
}
