import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    const server = createServerClient()
    const { data, error } = await server
      .from("assistant_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) throw error
    return NextResponse.json({ requests: data || [] })
  } catch (e) {
    console.error("admin assistant requests GET", e)
    const status = e instanceof Error && e.message === "Unauthorized" ? 401 : 500
    return NextResponse.json({ error: "Failed to load assistant requests" }, { status })
  }
}
