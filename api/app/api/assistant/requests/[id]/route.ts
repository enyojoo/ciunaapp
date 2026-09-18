import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"

export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  let user
  try {
    user = await requireUser(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const { id } = await params
  const server = createServerClient()
  const { data, error } = await server.from("assistant_requests").select("*").eq("id", id).maybeSingle()
  if (error || !data) {
    return createErrorResponse("Not found", 404)
  }
  if (data.user_id !== user.id) {
    return createErrorResponse("Forbidden", 403)
  }
  return NextResponse.json({ request: data })
})

export const PATCH = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  let user
  try {
    user = await requireUser(request)
  } catch {
    return createErrorResponse("Unauthorized", 401)
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const server = createServerClient()

  const { data: existing, error: loadErr } = await server.from("assistant_requests").select("*").eq("id", id).maybeSingle()
  if (loadErr || !existing) return createErrorResponse("Not found", 404)
  if (existing.user_id !== user.id) return createErrorResponse("Forbidden", 403)
  if (existing.status !== "draft") {
    return createErrorResponse("Only draft requests can be edited", 400)
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.request_type != null) patch.request_type = String(body.request_type).trim()
  if (body.payload != null && typeof body.payload === "object") patch.payload = body.payload
  if (body.status === "submitted" || body.status === "draft") patch.status = body.status

  const { data, error } = await server.from("assistant_requests").update(patch).eq("id", id).select().single()
  if (error) {
    console.error("assistant requests patch", error)
    return createErrorResponse("Failed to update", 500)
  }
  return NextResponse.json({ request: data })
})
