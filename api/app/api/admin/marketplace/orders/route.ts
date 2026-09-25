import { marketplaceRoute } from "@/lib/marketplace/http"
import { db, check } from "@/lib/marketplace/service"
export const GET = marketplaceRoute(async (request) => {
  let query = db()
    .from("marketplace_orders")
    .select(
      "id,public_id,line,payment_state,fulfillment_state,fulfillment_mode,payment_deadline,owner_team,assigned_to,exception_reason,created_at,updated_at,overdue_at,snapshot",
    )
    .order("created_at", { ascending: false })
    .limit(100)
  const queue = request.nextUrl.searchParams.get("queue")
  if (queue === "review")
    query = query
      .eq("payment_state", "awaiting_payment")
      .in(
        "id",
        (await db().from("marketplace_attempts").select("order_id").eq("state", "proof_submitted")).data?.map(
          (a) => a.order_id,
        ) || [],
      )
  if (queue === "acceptance")
    query = query.eq("payment_state", "paid").eq("fulfillment_state", "awaiting_acceptance")
  if (queue === "fulfillment") query = query.in("fulfillment_state", ["accepted", "in_progress"])
  if (queue === "exceptions") query = query.or("exception_reason.not.is.null,payment_state.eq.expired")
  if (queue === "refunds") query = query.eq("payment_state", "refund_pending")
  if (queue === "overdue") query = query.not("overdue_at", "is", null)
  const before = request.nextUrl.searchParams.get("before")
  if (before) query = query.lt("created_at", before)
  const [orders, jobs, health] = await Promise.all([
    query,
    db()
      .from("marketplace_jobs")
      .select("id,kind,state,attempts,last_error,updated_at")
      .or("state.eq.failed,last_error.not.is.null")
      .order("updated_at", { ascending: false })
      .limit(50),
    db().from("marketplace_worker_health").select("*").eq("id", "marketplace").maybeSingle(),
  ])
  check(orders.error)
  check(jobs.error)
  check(health.error)
  return {
    orders: orders.data,
    jobs: jobs.data,
    health: health.data,
    nextCursor: orders.data?.length === 100 ? orders.data[99].created_at : null,
  }
}, true)
