import { type NextRequest, NextResponse } from "next/server"
import { recipientService } from "@/lib/database"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling } from "@/lib/auth-utils"

export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("recipients")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  if (error) throw error
  return NextResponse.json({ recipients: data || [] })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  const data = await request.json()
  const recipient = await recipientService.create(user.id, data)
  return NextResponse.json({ recipient })
})

