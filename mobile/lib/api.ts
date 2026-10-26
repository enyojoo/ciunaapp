import Constants from "expo-constants"
import { tracked } from "@/lib/network-status"
import * as Device from "expo-device"
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

declare const __DEV__: boolean

/**
 * The iOS simulator shares the Mac's network, so a development build can always use localhost. The LAN address baked into
 * the native build at prebuild time goes stale as soon as the Mac changes network (home, office, hotspot).
 */
function simulatorLocalhost(url: string): string {
  if (!__DEV__ || Platform.OS !== "ios" || Device.isDevice) return url
  return url.replace(/^(https?:\/\/)(?:10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(?=[:/]|$)/, "$1localhost")
}

function apiBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiUrl
  if (typeof fromExtra === "string" && fromExtra.trim()) {
    return simulatorLocalhost(normalizeDevApiBase(fromExtra))
  }
  return normalizeDevApiBase(resolveApiUrl())
}

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path
  return joinApiPath(path, apiBaseUrl())
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return tracked(fetch(apiUrl(path), { ...init, credentials: "omit" }))
}

export async function fetchWithAuth(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) {
    headers.set("Authorization", `Bearer ${data.session.access_token}`)
  }
  let res = await tracked(fetch(apiUrl(path), { ...init, headers, credentials: "omit" }))
  if (res.status === 401) {
    const refreshed = await supabase.auth.refreshSession()
    if (refreshed.data.session?.access_token) {
      headers.set("Authorization", `Bearer ${refreshed.data.session.access_token}`)
      res = await tracked(fetch(apiUrl(path), { ...init, headers, credentials: "omit" }))
    }
  }
  return res
}
