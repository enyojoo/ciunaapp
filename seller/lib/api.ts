import { resolveApiUrl, joinApiPath } from "@ciuna/shared"
import { supabase } from "./supabase"

export class ApiError extends Error {
  constructor(public code: string, public status: number, public details?: any) {
    super(code)
  }
}

let activeMerchantId: string | null = null
export function setActiveMerchantId(id: string | null) {
  activeMerchantId = id
}
export function getActiveMerchantId() {
  return activeMerchantId
}

/** Bearer-token fetch against the Ciuna API. Sends the acting merchant; the server re-checks membership. */
export async function api<T = any>(path: string, init: RequestInit & { json?: unknown; merchantId?: string | null } = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`)
  const mid = init.merchantId === undefined ? activeMerchantId : init.merchantId
  if (mid) headers.set("x-merchant-id", mid)
  let body = init.body
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json")
    body = JSON.stringify(init.json)
  }
  const res = await fetch(joinApiPath(path, resolveApiUrl()), { ...init, headers, body, credentials: "omit" })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(payload.errorCode || payload.error || "UNAVAILABLE", res.status, payload.details)
  return payload as T
}

/** Direct-to-storage upload through a signed URL from /api/merchant/uploads. */
export async function uploadFile(file: File, kind: "image" | "document", folder: string) {
  const signed = await api<{ bucket: string; path: string; token: string; publicUrl: string | null; maxBytes: number }>("/api/merchant/uploads", {
    method: "POST",
    json: { kind, mimeType: file.type, folder },
  })
  if (file.size > signed.maxBytes) throw new ApiError("FILE_TOO_LARGE", 413)
  const { error } = await supabase.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type })
  if (error) throw new ApiError("UPLOAD_FAILED", 502)
  return { path: signed.path, url: signed.publicUrl }
}
