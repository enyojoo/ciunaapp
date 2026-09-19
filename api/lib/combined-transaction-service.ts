// Combined Transaction Service — `transactions` rows (Send + Hub checkout) for user/admin lists.
// Referral withdrawals appear on the same table when `reference` starts with `REFERRAL_PAYOUT:`.
// Office additionally merges `referral_payout_requests` and drops mirror `transactions` rows (see office transactions page).
import { createServerClient } from "@/lib/supabase"
import { adminService } from "./database"

export interface CombinedTransaction {
  id: string
  transaction_id: string
  type: "send" | "hub"
  user_id: string
  status: string
  created_at: string
  updated_at: string
  user?: {
    first_name: string
    last_name: string
    email: string
  }
  send_amount?: number
  send_currency?: string
  receive_amount?: number
  receive_currency?: string
  total_amount?: number
  fee_amount?: number
  fee_type?: string | null
  exchange_rate?: number
  logistics_fee_amount?: number | null
  logistics_fee_type_snapshot?: string | null
  payment_provider?: "manual" | "yookassa" | null
  gateway_status?: string | null
  gateway_confirmation_url?: string | null
  receipt_url?: string | null
  receipt_filename?: string | null
  contact_name?: string | null
  contact_phone?: string | null
  completed_at?: string | null
  failure_reason?: string | null
  recipient?: any
  fulfillment_type?: "bank_transfer" | "cash_hand"
  delivery_address_line?: string | null
  delivery_phone?: string | null
  /** Set for referral withdrawal rows (`REFERRAL_PAYOUT:…`). */
  reference?: string | null
  transaction_source?: string | null
  hub_product_id?: string | null
  /** From `hub_products.category` when joined (food vs mart badges). */
  hub_product_category?: string | null
  hub_snapshot?: Record<string, unknown> | null
  hub_fee_amount?: number | null
}

export const combinedTransactionService = {
  /**
   * User transaction list for Route Handlers only. Uses the service-role client and
   * filters by `userId` (must match the authenticated user from `requireUser`).
   * The anon `transactionService` path does not receive a browser session on the server,
   * so RLS would return no rows.
   */
  async getUserAllTransactions(
    userId: string,
    filters: {
      type?: "all" | "send" | "hub"
      status?: string
      limit?: number
    } = {},
  ): Promise<CombinedTransaction[]> {
    const limit = filters.limit || 100

    const supabase = createServerClient()
    const { data: sendTransactions, error } = await supabase
      .from("transactions")
      .select(`
        *,
        recipient:recipients(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching send transactions (server):", error)
      return []
    }

    const sendTxns: CombinedTransaction[] = (sendTransactions || []).map((tx) => {
      const isHub = (tx as { transaction_source?: string }).transaction_source === "hub"
      return {
        id: tx.id,
        transaction_id: tx.transaction_id,
        type: isHub ? ("hub" as const) : ("send" as const),
        user_id: tx.user_id,
        status: tx.status,
        created_at: tx.created_at,
        updated_at: tx.updated_at,
        send_amount: tx.send_amount,
        send_currency: tx.send_currency,
        receive_amount: tx.receive_amount,
        receive_currency: tx.receive_currency,
        total_amount: (tx as { total_amount?: number }).total_amount,
        fee_amount: (tx as { fee_amount?: number }).fee_amount,
        fee_type: (tx as { fee_type?: string | null }).fee_type ?? null,
        exchange_rate: (tx as { exchange_rate?: number }).exchange_rate,
        logistics_fee_amount: (tx as { logistics_fee_amount?: number | null }).logistics_fee_amount ?? null,
        logistics_fee_type_snapshot:
          (tx as { logistics_fee_type_snapshot?: string | null }).logistics_fee_type_snapshot ?? null,
        payment_provider: (tx as { payment_provider?: "manual" | "yookassa" | null }).payment_provider ?? null,
        gateway_status: (tx as { gateway_status?: string | null }).gateway_status ?? null,
        gateway_confirmation_url:
          (tx as { gateway_confirmation_url?: string | null }).gateway_confirmation_url ?? null,
        receipt_url: (tx as { receipt_url?: string | null }).receipt_url ?? null,
        receipt_filename: (tx as { receipt_filename?: string | null }).receipt_filename ?? null,
        contact_name: (tx as { contact_name?: string | null }).contact_name ?? null,
        contact_phone: (tx as { contact_phone?: string | null }).contact_phone ?? null,
        completed_at: (tx as { completed_at?: string | null }).completed_at ?? null,
        failure_reason: (tx as { failure_reason?: string | null }).failure_reason ?? null,
        recipient: tx.recipient,
        fulfillment_type: tx.fulfillment_type,
        delivery_address_line: tx.delivery_address_line ?? null,
        delivery_phone: tx.delivery_phone ?? null,
        reference: tx.reference ?? null,
        transaction_source: (tx as { transaction_source?: string }).transaction_source ?? "send",
        hub_product_id: (tx as { hub_product_id?: string }).hub_product_id ?? null,
        hub_snapshot: (tx as { hub_snapshot?: Record<string, unknown> | null }).hub_snapshot ?? null,
        hub_fee_amount: (tx as { hub_fee_amount?: number }).hub_fee_amount ?? null,
      }
    })

    /** Hub food vs mart list badges: join `hub_products.category` by `hub_product_id`. */
    const hubProductIds = [
      ...new Set(
        sendTxns
          .map((t) => (t.hub_product_id ? String(t.hub_product_id).trim() : ""))
          .filter(Boolean),
      ),
    ]
    let categoryByProductId = new Map<string, string>()
    if (hubProductIds.length > 0) {
      const { data: products, error: pErr } = await supabase
        .from("hub_products")
        .select("id, category")
        .in("id", hubProductIds)
      if (!pErr && products?.length) {
        categoryByProductId = new Map(
          products.map((p: { id: string; category?: string | null }) => [String(p.id), String(p.category ?? "")]),
        )
      }
    }
    for (const t of sendTxns) {
      const pid = t.hub_product_id ? String(t.hub_product_id).trim() : ""
      if (pid && categoryByProductId.has(pid)) {
        t.hub_product_category = categoryByProductId.get(pid) ?? null
      }
    }

    let combined: CombinedTransaction[] = [...sendTxns]

    if (filters.type === "send") {
      combined = sendTxns.filter((t) => t.type === "send")
    } else if (filters.type === "hub") {
      combined = sendTxns.filter((t) => t.type === "hub")
    }

    if (filters.status) {
      combined = combined.filter((tx) => tx.status === filters.status)
    }

    combined.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    return combined.slice(0, limit)
  },

  async getAdminAllTransactions(
    filters: {
      type?: "all" | "send" | "hub"
      status?: string
      search?: string
      limit?: number
    } = {},
  ): Promise<CombinedTransaction[]> {
    const limit = filters.limit || 100

    const sendTransactions = await adminService
      .getAllTransactions({
        status: filters.status,
        search: filters.search,
        limit,
      })
      .catch((error) => {
        console.error("Error fetching send transactions in getAdminAllTransactions:", error)
        return []
      })

    const sendTxns: CombinedTransaction[] = (sendTransactions || [])
      .filter((tx) => tx && tx.id)
      .map((tx) => {
        const isHub = (tx as { transaction_source?: string }).transaction_source === "hub"
        return {
          id: tx.id,
          transaction_id: tx.transaction_id || tx.id,
          type: isHub ? ("hub" as const) : ("send" as const),
          user_id: tx.user_id,
          status: tx.status || "pending",
          created_at: tx.created_at || new Date().toISOString(),
          updated_at: tx.updated_at || tx.created_at || new Date().toISOString(),
          send_amount: tx.send_amount,
          send_currency: tx.send_currency,
          receive_amount: tx.receive_amount,
          receive_currency: tx.receive_currency,
          recipient: tx.recipient,
          fulfillment_type: tx.fulfillment_type,
          delivery_address_line: tx.delivery_address_line ?? null,
          delivery_phone: tx.delivery_phone ?? null,
          user: tx.user,
          reference: (tx as { reference?: string | null }).reference ?? null,
          transaction_source: (tx as { transaction_source?: string }).transaction_source ?? "send",
          hub_product_id: (tx as { hub_product_id?: string }).hub_product_id ?? null,
          hub_snapshot: (tx as { hub_snapshot?: Record<string, unknown> | null }).hub_snapshot ?? null,
          hub_fee_amount: (tx as { hub_fee_amount?: number }).hub_fee_amount ?? null,
        }
      })

    const hubProductIdsAdmin = [
      ...new Set(
        sendTxns
          .map((t) => (t.hub_product_id ? String(t.hub_product_id).trim() : ""))
          .filter(Boolean),
      ),
    ]
    let categoryByProductIdAdmin = new Map<string, string>()
    if (hubProductIdsAdmin.length > 0) {
      const adminSupabase = createServerClient()
      const { data: products, error: pErr } = await adminSupabase
        .from("hub_products")
        .select("id, category")
        .in("id", hubProductIdsAdmin)
      if (!pErr && products?.length) {
        categoryByProductIdAdmin = new Map(
          products.map((p: { id: string; category?: string | null }) => [String(p.id), String(p.category ?? "")]),
        )
      }
    }
    for (const t of sendTxns) {
      const pid = t.hub_product_id ? String(t.hub_product_id).trim() : ""
      if (pid && categoryByProductIdAdmin.has(pid)) {
        t.hub_product_category = categoryByProductIdAdmin.get(pid) ?? null
      }
    }

    let combined: CombinedTransaction[] = [...sendTxns]

    if (filters.type === "send") {
      combined = sendTxns.filter((t) => t.type === "send")
    } else if (filters.type === "hub") {
      combined = sendTxns.filter((t) => t.type === "hub")
    }

    if (filters.status) {
      combined = combined.filter((tx) => tx.status === filters.status)
    }

    combined.sort((a, b) => {
      try {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      } catch {
        return 0
      }
    })

    return combined.slice(0, limit)
  },
}
