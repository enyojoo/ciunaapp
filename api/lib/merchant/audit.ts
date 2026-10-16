import { createServerClient } from "@/lib/supabase"

export async function audit(entry: {
  actorKind: "admin" | "merchant" | "system"
  actorId?: string | null
  actorRole?: string | null
  merchantId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  details?: Record<string, unknown>
}) {
  const { error } = await createServerClient().from("audit_log").insert({
    actor_kind: entry.actorKind,
    actor_id: entry.actorId ?? null,
    actor_role: entry.actorRole ?? null,
    merchant_id: entry.merchantId ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    details: entry.details ?? {},
  })
  // Auditing must never take down the action it records, but a failure must be loud.
  if (error) console.error("AUDIT_WRITE_FAILED", entry.action, error.message)
}
