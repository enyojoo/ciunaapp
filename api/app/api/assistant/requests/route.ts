import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"

export const GET = withErrorHandling(async (request: NextRequest) => {
  let user
  try {
    user = await requireUser(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const server = createServerClient()
  const { data, error } = await server
    .from("assistant_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("assistant requests list", error)
    return createErrorResponse("Failed to load requests", 500)
  }

  return NextResponse.json({ requests: data || [] })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  let user
  try {
    user = await requireUser(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const body = await request.json().catch(() => ({}))
  const requestType = String(body.request_type || "run_errands").trim() || "run_errands"
  const status = body.status === "submitted" ? "submitted" : "draft"
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {}

  const server = createServerClient()
  const row = {
    user_id: user.id,
    request_type: requestType,
    status,
    payload,
    quote_amount: body.quote_amount != null ? Number(body.quote_amount) : null,
    quote_currency: body.quote_currency != null ? String(body.quote_currency) : null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await server.from("assistant_requests").insert(row).select().single()
  if (error) {
    console.error("assistant requests create", error)
    return createErrorResponse("Failed to create request", 500)
  }

  return NextResponse.json({ request: data })
})
