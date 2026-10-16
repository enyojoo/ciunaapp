export type MerchantRole = "owner" | "manager" | "staff" | "finance"

export type MerchantPermission =
  | "profile"
  | "catalog"
  | "orders"
  | "availability"
  | "messages"
  | "earnings"
  | "payouts"
  | "team"
  | "documents"

const ALL: MerchantPermission[] = ["profile", "catalog", "orders", "availability", "messages", "earnings", "payouts", "team", "documents"]

export const ROLE_PERMISSIONS: Record<MerchantRole, ReadonlySet<MerchantPermission>> = {
  owner: new Set(ALL),
  manager: new Set<MerchantPermission>(["profile", "catalog", "orders", "availability", "messages", "earnings", "documents"]),
  staff: new Set<MerchantPermission>(["catalog", "orders", "availability", "messages"]),
  finance: new Set<MerchantPermission>(["orders", "earnings", "payouts"]),
}

export function can(role: MerchantRole, permission: MerchantPermission): boolean {
  return ROLE_PERMISSIONS[role].has(permission)
}
