import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling } from "@/lib/auth-utils"
import { sumCompletedVolumeInBaseCurrency } from "@ciuna/shared"

export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  const server = createServerClient()

  const { data: profile, error: profileErr } = await server
    .from("users")
    .select("base_currency")
    .eq("id", user.id)
    .single()

  if (profileErr) {
    console.error("completed-volume profile:", profileErr)
  }

  const baseCurrency = (profile?.base_currency as string) || "NGN"

  const [{ data: txs, error: txErr }, { data: rates, error: rateErr }] = await Promise.all([
    server
      .from("transactions")
      .select("status, send_amount, send_currency, total_amount, reference, transaction_source")
      .eq("user_id", user.id)
      .eq("status", "completed"),
    server.from("exchange_rates").select("from_currency, to_currency, rate, status").eq("status", "active"),
  ])

  if (txErr) {
    console.error("completed-volume txs:", txErr)
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 })
  }
  if (rateErr) {
    console.error("completed-volume rates:", rateErr)
    return NextResponse.json({ error: "Failed to load exchange rates" }, { status: 500 })
  }

  const volume = sumCompletedVolumeInBaseCurrency(txs || [], baseCurrency, rates || [])

  return NextResponse.json({ volume, baseCurrency })
})
