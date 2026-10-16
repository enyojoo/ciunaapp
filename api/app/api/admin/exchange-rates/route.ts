import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin, AdminForbiddenError } from "@/lib/admin-auth-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)

    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from("exchange_rates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ exchangeRates: data || [] })
  } catch (error) {
    if (error instanceof AdminForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    console.error("Error loading exchange rates:", error)
    return NextResponse.json({ error: "Failed to load exchange rates" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { rates } = await request.json()

    const serverClient = createServerClient()
    
    // Update exchange rates
    const updates = rates.map((rate: any) => ({
      from_currency: rate.from_currency,
      to_currency: rate.to_currency,
      rate: rate.rate,
      ...(rate.metadata != null ? { metadata: rate.metadata } : {}),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await serverClient
      .from("exchange_rates")
      .upsert(updates, { onConflict: "from_currency,to_currency" })

    if (error) throw error

    return NextResponse.json({ success: true, rates: data })
  } catch (error) {
    if (error instanceof AdminForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    console.error("Error updating exchange rates:", error)
    return NextResponse.json({ error: "Failed to update exchange rates" }, { status: 500 })
  }
}