import Constants from "expo-constants"
import { Platform } from "react-native"
import { joinApiPath, resolveApiUrl } from "@ciuna/shared/urls"
import { supabase } from "./supabase"

/** Expo web on localhost must call localhost:3002, not the LAN IP baked in for Expo Go. */
function normalizeDevApiBase(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "")
  if (Platform.OS !== "web" || typeof window === "undefined") return trimmed
  const pageHost = window.location.hostname
  if (pageHost !== "localhost" && pageHost !== "127.0.0.1") return trimmed
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed)) return trimmed
  const port = trimmed.match(/:(\d+)$/)?.[1] ?? "3002"
  return `http://localhost:${port}`
}

function apiBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiUrl
  if (typeof fromExtra === "string" && fromExtra.trim()) {
    return normalizeDevApiBase(fromExtra)
  }
  return normalizeDevApiBase(resolveApiUrl())
}

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path
  return joinApiPath(path, apiBaseUrl())
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
