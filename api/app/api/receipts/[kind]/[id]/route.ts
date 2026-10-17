import { authedRoute } from "@/lib/merchant/http"
import { MerchantError } from "@/lib/merchant/errors"
import { createServerClient } from "@/lib/supabase"
import { transactionStatusService } from "@/lib/transaction-status-service"
import { buildOrderReceipt, buildTransferReceipt } from "@/lib/receipts"

export const dynamic = "force-dynamic"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** A receipt for the signed-in customer's own paid order or booking (/order/:id) or completed transfer (/transfer/:id). */
export const GET = authedRoute(async (_req, user, params) => {
  const kind = String(params.kind)
  const id = String(params.id)
  if (kind === "transfer") {
    const tx = await transactionStatusService.getTransaction(id.toUpperCase())
    if (!tx || (tx as any).user_id !== user.id) throw new MerchantError("RECEIPT_NOT_FOUND", 404)
    return { receipt: buildTransferReceipt(tx) }
  }
  if (kind === "order" || kind === "booking") {
    const db = createServerClient()
    const q = db.from("marketplace_orders").select("*, user:users(first_name,last_name)").eq("user_id", user.id)
    const { data: order, error } = await (UUID.test(id) ? q.eq("id", id) : q.eq("public_id", id.toUpperCase())).maybeSingle()
    if (error) throw new MerchantError("DATABASE_ERROR", 500)
    if (!order) throw new MerchantError("RECEIPT_NOT_FOUND", 404)
    const { data: attempt } = await db.from("marketplace_attempts").select("rail,state").eq("order_id", (order as any).id).eq("state", "succeeded").limit(1).maybeSingle()
    const u = (order as any).user
    const name = [u?.first_name, u?.last_name].filter(Boolean).join(" ") || null
    return { receipt: buildOrderReceipt(order, name, (attempt as any)?.rail) }
  }
  throw new MerchantError("RECEIPT_NOT_FOUND", 404)
})
