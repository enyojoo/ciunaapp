import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"
import { withErrorHandling, createErrorResponse } from "@/lib/auth-utils"

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request)
  const supabase = createServerClient()

  const { data: authUsers, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error("Error fetching auth users:", error)
    return createErrorResponse("Failed to fetch auth users", 500)
  }

  const usersData = authUsers.users.map((user) => ({
    id: user.id,
    email: user.email,
    email_confirmed_at: user.email_confirmed_at,
    created_at: user.created_at,
  }))

  return NextResponse.json({ users: usersData })
})
