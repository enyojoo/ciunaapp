import { type NextRequest, NextResponse } from "next/server"
import { ADMIN_ASSIGNABLE_ROLES, isAssignableAdminRole } from "@/lib/admin-roles"
import { audit } from "@/lib/merchant/audit"
import { createServerClient } from "@/lib/supabase"
import {
  requireSuperAdmin,
  SuperAdminRequiredError,
  SUPER_ADMIN_ROLE,
} from "@/lib/admin-auth-utils"

function adminAuthErrorResponse(error: unknown) {
  if (error instanceof SuperAdminRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
  if (error instanceof Error && error.message === "Admin access required") {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 })
  }
  console.error("admin-users/[id] route error:", error)
  return NextResponse.json({ error: "Request failed" }, { status: 500 })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireSuperAdmin(request)
    const { id: targetId } = await params

    if (!targetId) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 })
    }

    if (targetId === actor.id) {
      return NextResponse.json({ error: "You cannot deactivate your own admin account" }, { status: 400 })
    }

    const serverClient = createServerClient()

    const { data: target, error: loadErr } = await serverClient
      .from("admin_users")
      .select("id, email, role, status")
      .eq("id", targetId)
      .maybeSingle()

    if (loadErr) throw loadErr
    if (!target) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    }

    if (target.role === SUPER_ADMIN_ROLE) {
      const { data: supers, error: countErr } = await serverClient
        .from("admin_users")
        .select("id")
        .eq("role", SUPER_ADMIN_ROLE)
        .eq("status", "active")

      if (countErr) throw countErr
      const activeSupers = (supers || []).filter((r) => r.id !== targetId)
      if (activeSupers.length === 0) {
        return NextResponse.json(
          { error: "Cannot remove the last active super_admin" },
          { status: 400 },
        )
      }
    }

    const { error: upErr } = await serverClient
      .from("admin_users")
      .update({ status: "inactive" })
      .eq("id", targetId)

    if (upErr) throw upErr
    await audit({ actorKind: "admin", actorId: actor.id, actorRole: actor.role, action: "admin_user.deactivated", entityType: "admin_user", entityId: targetId })

    return NextResponse.json({ success: true })
  } catch (error) {
    return adminAuthErrorResponse(error)
  }
}

/** Change an admin's role. Body: { role }. A super admin cannot change their own role or demote the last active super admin. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireSuperAdmin(request)
    const { id: targetId } = await params
    const body = await request.json().catch(() => ({}))
    const role = typeof body?.role === "string" ? body.role.trim() : ""
    if (!targetId) return NextResponse.json({ error: "User id is required" }, { status: 400 })
    if (!isAssignableAdminRole(role)) {
      return NextResponse.json({ error: `Role must be one of: ${ADMIN_ASSIGNABLE_ROLES.join(", ")}` }, { status: 400 })
    }
    if (targetId === actor.id) return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 })

    const serverClient = createServerClient()
    const { data: target, error: loadErr } = await serverClient.from("admin_users").select("id, role, status").eq("id", targetId).maybeSingle()
    if (loadErr) throw loadErr
    if (!target) return NextResponse.json({ error: "Admin user not found" }, { status: 404 })

    if (target.role === SUPER_ADMIN_ROLE && role !== SUPER_ADMIN_ROLE) {
      const { data: supers, error: countErr } = await serverClient.from("admin_users").select("id").eq("role", SUPER_ADMIN_ROLE).eq("status", "active")
      if (countErr) throw countErr
      if ((supers || []).filter((r) => r.id !== targetId).length === 0) {
        return NextResponse.json({ error: "Cannot demote the last active super_admin" }, { status: 400 })
      }
    }

    const { error: updErr } = await serverClient.from("admin_users").update({ role }).eq("id", targetId)
    if (updErr) throw updErr
    await audit({ actorKind: "admin", actorId: actor.id, actorRole: actor.role, action: "admin_user.role_changed", entityType: "admin_user", entityId: targetId, details: { from: target.role, to: role } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return adminAuthErrorResponse(error)
  }
}
