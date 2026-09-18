import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import {
  requireSuperAdmin,
  SuperAdminRequiredError,
} from "@/lib/admin-auth-utils"

const ASSIGNABLE_ROLES = ["admin"] as const

function isAssignableRole(role: string): role is (typeof ASSIGNABLE_ROLES)[number] {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(role)
}

async function findAuthUserByEmail(
  serverClient: ReturnType<typeof createServerClient>,
  email: string,
) {
  const target = email.trim().toLowerCase()
  let page = 1
  const perPage = 200
  for (let i = 0; i < 50; i++) {
    const { data, error } = await serverClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const found = data.users.find((u) => u.email?.toLowerCase() === target)
    if (found) return found
    if (data.users.length < perPage) return null
    page++
  }
  return null
}

function adminAuthErrorResponse(error: unknown) {
  if (error instanceof SuperAdminRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
  if (error instanceof Error && error.message === "Admin access required") {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 })
  }
  console.error("admin-users route error:", error)
  return NextResponse.json({ error: "Request failed" }, { status: 500 })
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from("admin_users")
      .select("id, email, name, role, status, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ adminUsers: data || [] })
  } catch (error) {
    return adminAuthErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const role = typeof body.role === "string" ? body.role.trim() : ""

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    if (!role || !isAssignableRole(role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${ASSIGNABLE_ROLES.join(", ")}` },
        { status: 400 },
      )
    }

    const serverClient = createServerClient()

    const { data: existingRow } = await serverClient
      .from("admin_users")
      .select("id, email, status")
      .ilike("email", email)
      .maybeSingle()

    if (existingRow?.status === "active") {
      return NextResponse.json({ error: "An active admin with this email already exists" }, { status: 409 })
    }

    let userId: string | null = null

    const { data: inviteData, error: inviteError } = await serverClient.auth.admin.inviteUserByEmail(email, {
      data: {
        isAdmin: true,
        role,
        name: name || email,
      },
    })

    if (!inviteError && inviteData?.user) {
      userId = inviteData.user.id
    } else {
      const msg = inviteError?.message?.toLowerCase() ?? ""
      const already =
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists") ||
        inviteError?.status === 422
      if (!already) {
        console.error("inviteUserByEmail failed:", inviteError)
        return NextResponse.json(
          { error: inviteError?.message || "Failed to invite user" },
          { status: 400 },
        )
      }
      const existingAuth = await findAuthUserByEmail(serverClient, email)
      if (!existingAuth) {
        return NextResponse.json(
          { error: "Could not resolve existing auth user for this email" },
          { status: 400 },
        )
      }
      userId = existingAuth.id
      const { error: metaError } = await serverClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...((existingAuth.user_metadata as Record<string, unknown>) || {}),
          isAdmin: true,
          role,
          name: name || email,
        },
      })
      if (metaError) {
        console.error("updateUserById metadata failed:", metaError)
        return NextResponse.json({ error: metaError.message }, { status: 400 })
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Could not determine user id" }, { status: 500 })
    }

    const row = {
      id: userId,
      email: email.toLowerCase(),
      name: name || email,
      role,
      status: "active" as const,
    }

    const { error: upsertErr } = await serverClient.from("admin_users").upsert(row, { onConflict: "id" })
    if (upsertErr) {
      console.error("admin_users upsert failed:", upsertErr)
      return NextResponse.json({ error: upsertErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: userId })
  } catch (error) {
    return adminAuthErrorResponse(error)
  }
}
