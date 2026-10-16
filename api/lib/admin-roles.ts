/**
 * Office roles. `super_admin` can do everything; legacy `admin` is treated as `ops` until Office assigns roles.
 */
export type AdminRole = "ops" | "support" | "finance" | "compliance" | "super_admin"

export type AdminPermission =
  | "merchants.review"
  | "merchants.manage"
  | "listings.review"
  | "orders.manage"
  | "finance.manage"
  | "fees.manage"
  | "kyb.manage"
  | "roles.manage"
  | "audit.read"
  | "support.read"

const ALL: AdminPermission[] = [
  "merchants.review", "merchants.manage", "listings.review", "orders.manage", "finance.manage",
  "fees.manage", "kyb.manage", "roles.manage", "audit.read", "support.read",
]

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  super_admin: new Set(ALL),
  ops: new Set<AdminPermission>(["merchants.review", "merchants.manage", "listings.review", "orders.manage", "audit.read", "support.read"]),
  support: new Set<AdminPermission>(["orders.manage", "support.read"]),
  finance: new Set<AdminPermission>(["finance.manage", "orders.manage", "audit.read", "support.read"]),
  compliance: new Set<AdminPermission>(["merchants.review", "kyb.manage", "audit.read", "support.read"]),
}

export function normalizeAdminRole(role: string | null | undefined): AdminRole {
  if (role === "super_admin" || role === "ops" || role === "support" || role === "finance" || role === "compliance") return role
  return "ops"
}

export function adminCan(role: string | null | undefined, permission: AdminPermission): boolean {
  return ADMIN_ROLE_PERMISSIONS[normalizeAdminRole(role)].has(permission)
}
