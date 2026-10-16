import { NextResponse, type NextRequest } from "next/server"
import { getAdminUser } from "@/lib/admin-auth-utils"
import { ADMIN_ROLE_PERMISSIONS, normalizeAdminRole } from "@/lib/admin-roles"

export const dynamic = "force-dynamic"

/** The signed-in Office user with their role and permissions, so Office hides controls from the server's matrix (not from client metadata). */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request)
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 401 })
  const role = admin.role === "admin" ? "super_admin" : normalizeAdminRole(admin.role)
  return NextResponse.json({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role,
    legacyRole: admin.role === "admin",
    permissions: [...ADMIN_ROLE_PERMISSIONS[role]].sort(),
  })
}
