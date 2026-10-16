"use client"
import { useEffect, useState } from "react"
import { officeFetch } from "./api-client"

export interface QueueCount {
  count: number
  oldest: string | null
  over_sla: number | null
  limit_hours: number | null
  mine?: number
  unavailable?: boolean
}
export type QueueKey = "merchants" | "payouts" | "listings" | "kyc" | "transactions" | "support"
export interface QueuesResponse { queues: Partial<Record<QueueKey, QueueCount>>; sla: Record<string, number> }

type State = { data: QueuesResponse | null; error: boolean; loading: boolean }
let state: State = { data: null, error: false, loading: false }
const listeners = new Set<(s: State) => void>()
const set = (s: State) => { state = s; listeners.forEach((l) => l(s)) }

/** Fetches `GET /api/admin/queues` once for everyone on the page (sidebar badges, Needs action). */
export async function refreshQueues(): Promise<void> {
  if (state.loading) return
  set({ ...state, loading: true })
  try {
    const res = await officeFetch("/api/admin/queues")
    if (!res.ok) throw new Error(String(res.status))
    set({ data: (await res.json()) as QueuesResponse, error: false, loading: false })
  } catch {
    set({ data: state.data, error: true, loading: false })
  }
}

const REFRESH_MS = 60_000

/** Shared queue counts. `ready` is false until the first answer; badges and cards render nothing until then. */
export function useQueues() {
  const [s, setS] = useState<State>(state)
  useEffect(() => {
    listeners.add(setS)
    if (!state.data && !state.loading) void refreshQueues()
    else setS(state)
    const t = setInterval(() => { if (document.visibilityState === "visible") void refreshQueues() }, REFRESH_MS)
    return () => { listeners.delete(setS); clearInterval(t) }
  }, [])
  return { queues: s.data?.queues ?? {}, sla: s.data?.sla ?? null, ready: !!s.data, error: s.error && !s.data, refresh: refreshQueues }
}
