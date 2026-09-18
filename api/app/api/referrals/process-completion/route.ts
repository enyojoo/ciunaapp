import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"
import { processReferralRewardsOnCompletedSend } from "@/lib/referral-reward-service"

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const transactionId = body?.transactionId as string | undefined
    if (!transactionId) {
      return NextResponse.json({ error: "transactionId required" }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data: tx, error } = await supabase
      .from("transactions")
      .select(
        `
        *,
        recipient:recipients(*),
        user:users(first_name, last_name, email)
      `,
      )
      .eq("transaction_id", transactionId)
      .single()

    if (error || !tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (tx.status !== "completed") {
      return NextResponse.json({ error: "Transaction not completed" }, { status: 400 })
    }

    await processReferralRewardsOnCompletedSend(tx as any)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e?.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("process-completion:", e)
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
  }
}
