"use client"
import { useEffect, useState, type ReactNode } from "react"
import { officeFetch } from "./api-client"

export interface AdminMe { id: string; email: string; name: string; role: string; legacyRole: boolean; permissions: string[] }

let cache: Promise<AdminMe | null> | null = null

/** The signed-in Office user and the server's permission list (`GET /api/admin/me`). Cached for the page's lifetime. */
export function loadAdminMe(force = false): Promise<AdminMe | null> {
  if (!cache || force) {
    cache = officeFetch("/api/admin/me")
      .then((r) => (r.ok ? (r.json() as Promise<AdminMe>) : null))
      .catch(() => null)
  }
  return cache
}

export function usePermissions() {
  const [me, setMe] = useState<AdminMe | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let live = true
    void loadAdminMe().then((m) => { if (live) { setMe(m); setReady(true) } })
    return () => { live = false }
  }, [])
  const can = (permission: string) => !!me?.permissions.includes(permission)
  return { me, ready, can, role: me?.role ?? null }
}

/**
 * Hides children the user is not allowed to use. The API still enforces the permission; this only removes controls.
 * While loading it renders nothing, so a control never flashes for a role that cannot use it.
 */
export function Can({ permission, children, fallback = null }: { permission: string; children: ReactNode; fallback?: ReactNode }) {
  const { ready, can } = usePermissions()
  if (!ready) return null
  return <>{can(permission) ? children : fallback}</>
}
