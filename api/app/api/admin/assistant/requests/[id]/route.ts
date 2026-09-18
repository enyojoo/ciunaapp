import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"

const ALLOWED_STATUS = new Set(["draft", "submitted", "quoted", "paid", "in_progress", "completed", "cancelled"])

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const server = createServerClient()

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.status != null && ALLOWED_STATUS.has(String(body.status))) {
      patch.status = String(body.status)
    }
    if (body.quote_amount !== undefined) patch.quote_amount = body.quote_amount != null ? Number(body.quote_amount) : null
    if (body.quote_currency !== undefined) patch.quote_currency = body.quote_currency
    if (body.admin_notes !== undefined) patch.admin_notes = body.admin_notes
    if (body.transaction_id !== undefined) patch.transaction_id = body.transaction_id

    const { data, error } = await server.from("assistant_requests").update(patch).eq("id", id).select().single()
    if (error) throw error
    return NextResponse.json({ request: data })
  } catch (e) {
    console.error("admin assistant requests PATCH", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to update request" }, { status })
  }
}
