"use client"
import { api } from "@/lib/api"
import { useQuery } from "@/lib/query"
import type { SellerOrder } from "@/components/orders/format"
import type { Thread } from "@/components/messages/format"

export interface HomeAggregate {
  today?: { orders: number; gross: number; fee: number; net: number; currency: string } | null
  lowStock?: Array<{ id: string; title: string; stock: number }>
  documentsExpiring?: Array<{ id?: string; kind: string; expiresAt: string }>
  ordersToday?: number
  delta?: { orders?: { direction: "up" | "down"; amount: number } }
}
interface OrdersRes { orders: SellerOrder[]; counts: { new: number; active: number } }
interface EarnItem { currency: string; commission: number; net: number; fulfilled_at: string }

export interface TodayEarnings { orders: number; gross: number; fee: number; net: number; currency: string }

/** Sums today's (local day) earning rows for the merchant's main currency. Used only when the API has no `today` aggregate. */
export function sumToday(items: EarnItem[], currency: string, now = new Date()): TodayEarnings | null {
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const rows = items.filter((i) => i.currency === currency && new Date(i.fulfilled_at) >= start)
  if (!rows.length) return null
  const net = rows.reduce((s, r) => s + Number(r.net || 0), 0)
  const fee = rows.reduce((s, r) => s + Number(r.commission || 0), 0)
  return { orders: rows.length, gross: net + fee, fee, net, currency }
}

/** All Home data from existing endpoints. `/api/merchant/home` is optional: when it is missing or fails the page derives what it can and hides the rest. */
export function useHomeData(opts: { enabled: boolean; orders: boolean; messages: boolean; earnings: boolean; currency: string }) {
  const { enabled, orders, messages, earnings, currency } = opts
  const o = useQuery<OrdersRes>(enabled && orders ? "home:orders" : null, () => api<OrdersRes>("/api/merchant/orders?status=new&limit=20"), { refreshMs: 30_000 })
  const m = useQuery<{ threads: Thread[]; unread: number }>(enabled && messages ? "home:messages" : null, () => api("/api/merchant/messages"), { refreshMs: 30_000 })
  const e = useQuery<{ items: EarnItem[] }>(enabled && earnings ? "home:earnings" : null, () => api("/api/merchant/earnings/items?limit=100"), { refreshMs: 60_000 })
  const h = useQuery<HomeAggregate>(enabled ? "home:aggregate" : null, () => api<HomeAggregate>("/api/merchant/home").catch(() => ({}) as HomeAggregate), { refreshMs: 60_000 })
  const today = h.data && "today" in h.data ? h.data.today ?? null : e.data ? sumToday(e.data.items, currency) : null
  return { orders: o, messages: m, earnings: e, aggregate: h.data, today }
}
