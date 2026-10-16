/**
 * Office roles. `super_admin` can do everything; legacy `admin` is treated as `ops` until Office assigns roles.
 */
export type AdminRole = "ops" | "support" | "finance" | "compliance" | "super_admin"

export type AdminPermission =
  | "merchants.read"
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
  | "users.read"
  | "users.manage"
  | "rates.manage"
  | "settings.manage"
  | "transactions.manage"
  | "catalog.manage"
  | "experts.manage"

const ALL: AdminPermission[] = [
  "merchants.read", "merchants.review", "merchants.manage", "listings.review", "orders.manage", "finance.manage",
  "fees.manage", "kyb.manage", "roles.manage", "audit.read", "support.read",
  "users.read", "users.manage", "rates.manage", "settings.manage", "transactions.manage", "catalog.manage", "experts.manage",
]

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  super_admin: new Set(ALL),
  ops: new Set<AdminPermission>(["merchants.read", "merchants.review", "merchants.manage", "listings.review", "orders.manage", "audit.read", "support.read", "users.read", "users.manage", "transactions.manage", "catalog.manage", "experts.manage"]),
  support: new Set<AdminPermission>(["merchants.read", "orders.manage", "support.read", "users.read"]),
  finance: new Set<AdminPermission>(["merchants.read", "finance.manage", "orders.manage", "audit.read", "support.read", "users.read", "rates.manage", "transactions.manage"]),
  compliance: new Set<AdminPermission>(["merchants.read", "merchants.review", "kyb.manage", "audit.read", "support.read", "users.read", "users.manage"]),
}

export function normalizeAdminRole(role: string | null | undefined): AdminRole {
  if (role === "super_admin" || role === "ops" || role === "support" || role === "finance" || role === "compliance") return role
  return "ops"
}

export function adminCan(role: string | null | undefined, permission: AdminPermission): boolean {
  return ADMIN_ROLE_PERMISSIONS[normalizeAdminRole(role)].has(permission)
}

/** Read-only requests need no write permission; any admin role may read these legacy resources except settings and payouts. */
const SAFE = new Set(["GET", "HEAD", "OPTIONS"])

/**
 * Permission required by a legacy `/api/admin/*` route (those that predate `adminRoute`). `null` means no extra check here
 * (the route enforces its own, e.g. `adminRoute`). Keep in step with `docs/build-plan/office.md`.
 */
export function legacyAdminPermission(pathname: string, method: string): AdminPermission | null {
  const read = SAFE.has(method.toUpperCase())
  const p = pathname.replace(/\/+$/, "")
  const rules: [RegExp, AdminPermission | null, AdminPermission | null][] = [
    // [path, permission for writes, permission for reads (null = any admin role)]
    [/^\/api\/admin\/(exchange-rates|currencies)(\/|$)/, "rates.manage", null],
    [/^\/api\/admin\/referral-payouts(\/|$)/, "finance.manage", "finance.manage"],
    [/^\/api\/admin\/settings(\/|$)/, "settings.manage", null],
    [/^\/api\/admin\/transactions(\/|$)/, "transactions.manage", null],
    [/^\/api\/admin\/(users|auth-users)(\/|$)/, "users.manage", "users.read"],
    [/^\/api\/admin\/assistant(\/|$)/, "orders.manage", "support.read"],
    [/^\/api\/admin\/expert(\/|$)/, "experts.manage", null],
    [/^\/api\/admin\/hub(\/|$)/, "catalog.manage", null],
    [/^\/api\/referrals\/process-completion$/, "finance.manage", "finance.manage"],
    [/^\/api\/send-email-notification$/, "orders.manage", "orders.manage"],
  ]
  for (const [re, write, readPerm] of rules) if (re.test(p)) return read ? readPerm : write
  return null
}

/** Legacy role `admin` (before Office assigned roles) keeps full access to the legacy routes so nobody is locked out. */
export function adminCanLegacy(role: string | null | undefined, permission: AdminPermission): boolean {
  if (role === "admin") return true
  return adminCan(role, permission)
}
