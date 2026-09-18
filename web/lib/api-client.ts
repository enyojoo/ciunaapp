import { joinApiPath } from "@ciuna/shared"

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path
  return joinApiPath(path)
}

/** Unauthenticated call to api.ciuna.com (or local api). Never cookies. */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  return fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: "omit",
  })
}
