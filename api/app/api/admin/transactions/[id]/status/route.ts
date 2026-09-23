// Admin transaction status update API endpoint

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"
import {
  processReferralRewardsOnCompletedSend,
  rollbackReferralRewardsForTransaction,
} from "@/lib/referral-reward-service"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const adminUser = await requireAdmin(request)
    const resolved = await context.params
    const transactionId = resolved?.id
    const body = await request.json()
    if (!transactionId) {
      return NextResponse.json({
        error: "Transaction ID is required"
      }, { status: 400 })
    }


    const { status, failure_reason, reference, completed_at, settlement_metadata } = body

    if (!status && settlement_metadata == null) {
      return NextResponse.json({
        error: "Status or settlement_metadata is required",
      }, { status: 400 })
    }

    // Use service role client for admin operations
    const supabase = createServerClient()

    const { data: currentTransaction, error: currentError } = await supabase
      .from("transactions")
      .select(`
        *,
        recipient:recipients(*),
        user:users(first_name, last_name, email)
      `)
      .eq("transaction_id", transactionId)
      .single()
    if (currentError || !currentTransaction) {
      return NextResponse.json({
        error: "Transaction not found"
      }, { status: 404 })
    }
    const previousStatus = currentTransaction.status as string

    // Update transaction status directly
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (status) {
      updateData.status = status
    }
    if (settlement_metadata != null && typeof settlement_metadata === "object") {
      const prev =
        currentTransaction.settlement_metadata &&
        typeof currentTransaction.settlement_metadata === "object"
          ? (currentTransaction.settlement_metadata as Record<string, unknown>)
          : {}
      updateData.settlement_metadata = { ...prev, ...settlement_metadata }
    }

    if (failure_reason) {
      updateData.failure_reason = failure_reason
    }

    if (reference) {
      updateData.reference = reference
    }

    if (completed_at) {
      updateData.completed_at = completed_at
    } else if (status === "completed") {
      updateData.completed_at = new Date().toISOString()
    }

    if (!updateData.status && !updateData.settlement_metadata) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('transaction_id', transactionId)
      .select(`
        *,
        recipient:recipients(*),
        user:users(first_name, last_name, email)
      `)
      .maybeSingle()

    if (updateError) {
      return NextResponse.json({ 
        error: `Failed to update transaction: ${updateError.message}` 
      }, { status: 400 })
    }

    if (!updatedTransaction) {
      return NextResponse.json({
        error: "Transaction not found"
      }, { status: 404 })
    }

    const nextStatus = String(updateData.status ?? previousStatus)
    if (previousStatus !== "completed" && nextStatus === "completed") {
      await processReferralRewardsOnCompletedSend(updatedTransaction as any)
    } else if (previousStatus === "completed" && nextStatus !== "completed") {
      await rollbackReferralRewardsForTransaction(currentTransaction as any)
    }

    console.info("[admin-audit] transaction.status", {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      transactionId,
      previousStatus,
      nextStatus,
      reference: reference ?? null,
    })

    return NextResponse.json({ 
      success: true, 
      transaction: updatedTransaction 
    })
  } catch (error) {
    console.error("Error updating transaction status:", error)
    const message = error instanceof Error ? error.message : "Failed to update transaction status"
    const statusCode = message.includes("Admin access required") ? 403 : 500
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
