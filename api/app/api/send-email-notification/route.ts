import { NextRequest, NextResponse } from "next/server"
import { EmailNotificationService } from "@/lib/email-notification-service"
import { requireAdmin, requireUser } from "@/lib/auth-utils"
import { createServerClient } from "@/lib/supabase"

function hasInternalSecret(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get("x-internal-secret") || request.headers.get("authorization")
  return header === secret || header === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  try {
    const { transactionId, status, userEmail, firstName, type } = await request.json()

    if (type === "transaction" && transactionId && status) {
      if (!hasInternalSecret(request)) {
        const user = await requireUser(request)
        const supabase = createServerClient()
        const { data: row } = await supabase
          .from("transactions")
          .select("user_id, transaction_id")
          .eq("transaction_id", transactionId)
          .maybeSingle()
        if (!row || row.user_id !== user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
      }
      await EmailNotificationService.sendTransactionStatusEmail(transactionId, status)
      return NextResponse.json({ success: true, message: "Transaction email notification sent" })
    }

    if (type === "admin-transaction" && transactionId && status) {
      if (!hasInternalSecret(request)) {
        await requireAdmin(request)
      }
      await EmailNotificationService.sendAdminTransactionNotification(transactionId, status)
      return NextResponse.json({ success: true, message: "Admin transaction notification sent" })
    }

    if (type === "welcome" && userEmail && firstName) {
      if (!hasInternalSecret(request)) {
        await requireUser(request)
      }
      await EmailNotificationService.sendWelcomeEmail(userEmail, firstName)
      return NextResponse.json({ success: true, message: "Welcome email notification sent" })
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    console.error("Email notification API error:", error)
    return NextResponse.json(
      {
        error: "Failed to send email notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
