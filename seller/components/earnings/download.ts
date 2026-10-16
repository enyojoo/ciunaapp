import { resolveApiUrl, joinApiPath } from "@ciuna/shared"
import { supabase } from "@/lib/supabase"
import { ApiError, getActiveMerchantId } from "@/lib/api"

/** Fetches a CSV with the Bearer token and hands it to the browser as a file download. */
export async function downloadCsv(path: string, fallbackName: string) {
  const headers = new Headers()
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`)
  const mid = getActiveMerchantId()
  if (mid) headers.set("x-merchant-id", mid)
  const res = await fetch(joinApiPath(path, resolveApiUrl()), { headers, credentials: "omit" })
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new ApiError(payload.errorCode || payload.error || "UNAVAILABLE", res.status)
  }
  const disposition = res.headers.get("Content-Disposition") || ""
  const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] || fallbackName
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
