import { apiFetch, fetchWithAuth } from "./api"

/** A failed call to the marketplace/discovery API: HTTP status plus the stable error code when there is one. */
export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string) {
    super(code)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

async function parse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as (T & { errorCode?: string; error?: string }) | null
  if (!res.ok) throw new ApiError(res.status, String(body?.errorCode || body?.error || "ERROR"))
  return body as T
}

/** Signed-in JSON call. Network failures surface as ApiError(0). */
export async function authJson<T>(path: string, init?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<T> {
  try {
    const res = await fetchWithAuth(path, {
      method: init?.method,
      signal: init?.signal,
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
    return await parse<T>(res)
  } catch (e) {
    if (e instanceof ApiError) throw e
    if ((e as { name?: string })?.name === "AbortError") throw e
    throw new ApiError(0, "NETWORK")
  }
}

/** Public (no session) JSON GET. */
export async function publicJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  try {
    return await parse<T>(await apiFetch(path, { signal }))
  } catch (e) {
    if (e instanceof ApiError) throw e
    if ((e as { name?: string })?.name === "AbortError") throw e
    throw new ApiError(0, "NETWORK")
  }
}

export const isAbort = (e: unknown) => (e as { name?: string })?.name === "AbortError"
