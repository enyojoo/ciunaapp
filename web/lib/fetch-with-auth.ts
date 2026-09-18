import { supabase } from "./supabase"
import { apiUrl } from "./api-client"

const SESSION_WAIT_MS = 4000

export type FetchWithAuthOptions = {
  accessToken?: string | null
}

/**
 * Cross-origin API calls with Bearer token. Session lives in localStorage, not cookies.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
  authOptions?: FetchWithAuthOptions
): Promise<Response> {
  const headers = new Headers(init?.headers)
  let explicitToken = authOptions?.accessToken ?? null

  const attachSessionToken = async () => {
    if (explicitToken) {
      headers.set("Authorization", `Bearer ${explicitToken}`)
      return
    }
    let {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      const deadline = Date.now() + SESSION_WAIT_MS
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 50))
        ;({
          data: { session },
        } = await supabase.auth.getSession())
        if (session?.access_token) break
      }
    }
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`)
      return
    }
    const { data } = await supabase.auth.refreshSession()
    if (data.session?.access_token) {
      headers.set("Authorization", `Bearer ${data.session.access_token}`)
    }
  }

  await attachSessionToken()

  const resolvedInput =
    typeof input === "string" && input.startsWith("/") ? apiUrl(input) : input

  const doFetch = () =>
    fetch(resolvedInput, {
      ...init,
      headers,
      credentials: "omit",
    })

  let res = await doFetch()
  if (res.status === 401) {
    explicitToken = null
    await supabase.auth.refreshSession()
    headers.delete("Authorization")
    await attachSessionToken()
    res = await doFetch()
  }
  return res
}
