import { joinApiPath, resolveApiUrl } from "@ciuna/shared/urls"
import { supabase } from "./supabase"

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path
  return joinApiPath(path, resolveApiUrl())
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), { ...init, credentials: "omit" })
}

export async function fetchWithAuth(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) {
    headers.set("Authorization", `Bearer ${data.session.access_token}`)
  }
  let res = await fetch(apiUrl(path), { ...init, headers, credentials: "omit" })
  if (res.status === 401) {
    const refreshed = await supabase.auth.refreshSession()
    if (refreshed.data.session?.access_token) {
      headers.set("Authorization", `Bearer ${refreshed.data.session.access_token}`)
      res = await fetch(apiUrl(path), { ...init, headers, credentials: "omit" })
    }
  }
  return res
}
