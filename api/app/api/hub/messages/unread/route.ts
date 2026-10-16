import { marketplaceRoute } from "@/lib/marketplace/http"
import { tableExists } from "@/lib/merchant/messages"
import { createServerClient } from "@/lib/supabase"

export const GET = marketplaceRoute(async (_request, _ctx, user) => {
  if (!(await tableExists("order_messages"))) return { count: 0, orders: [], unavailable: true }
  const { data, error } = await createServerClient().rpc("messages_unread_customer", { p_user: user.id })
  if (error) throw new Error("unread failed")
  const orders = (data || []).map((r: any) => ({ orderId: r.order_id, unread: Number(r.unread) }))
  return { count: orders.reduce((n: number, o: { unread: number }) => n + o.unread, 0), orders }
})
