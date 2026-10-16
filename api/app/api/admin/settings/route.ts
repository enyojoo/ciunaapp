import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin, AdminForbiddenError } from "@/lib/admin-auth-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)

    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from("settings")
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ settings: data })
  } catch (error) {
    if (error instanceof AdminForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    console.error("Error loading settings:", error)
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }
}
