// Admin transaction status update API endpoint

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import {
  processReferralRewardsOnCompletedSend,
  rollbackReferralRewardsForTransaction,
} from "@/lib/referral-reward-service"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolved = await context.params
    const transactionId = resolved?.id
    const body = await request.json()
    if (!transactionId) {
      return NextResponse.json({
        error: "Transaction ID is required"
      }, { status: 400 })
    }


    const { status, failure_reason, reference, completed_at } = body

    if (!status) {
      return NextResponse.json({ 
        error: "Status is required" 
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
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
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

    if (previousStatus !== "completed" && status === "completed") {
      await processReferralRewardsOnCompletedSend(updatedTransaction as any)
    } else if (previousStatus === "completed" && status !== "completed") {
      await rollbackReferralRewardsForTransaction(currentTransaction as any)
    }

    return NextResponse.json({ 
      success: true, 
      transaction: updatedTransaction 
    })
  } catch (error) {
    console.error("Error updating transaction status:", error)
    return NextResponse.json({ 
      error: "Failed to update transaction status" 
    }, { status: 500 })
  }
}
