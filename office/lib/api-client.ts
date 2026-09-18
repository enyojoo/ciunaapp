import { supabase } from "./supabase"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"

/** Join base URL (may end with `/`) and path (should start with `/`) without `//` before the path. */
function joinApiUrl(path: string): string {
  if (path.startsWith("http")) return path
  const base = API_URL.replace(/\/+$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}

export async function officeFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = joinApiUrl(path)
  const headers = new Headers(options.headers || {})

  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json")
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`)
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "omit",
  }

  return fetch(url, fetchOptions)
}
