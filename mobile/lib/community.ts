import { useEffect, useMemo, useSyncExternalStore } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { COMMUNITY_IDS, isCommunityId, type CommunityId } from "@ciuna/shared"
import { useHubCatalog } from "@/lib/use-hub-catalog"
import type { HubVendor } from "@/lib/types"

/**
 * The community the shopper is browsing Food and Mart for (Nigerian, Chinese, ...). A store carries the communities it
 * serves; choosing one narrows stores, and their products, to those stores. Device-local, shared by Food and Mart.
 */
const KEY = "ciuna_community"

type State = { community: CommunityId | null; ready: boolean }
let state: State = { community: null, ready: false }
let hydrating: Promise<void> | null = null
const listeners = new Set<() => void>()

function set(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
const snapshot = () => state

function hydrate(): Promise<void> {
  if (state.ready) return Promise.resolve()
  if (!hydrating) {
    hydrating = AsyncStorage.getItem(KEY)
      .then((v) => set({ community: isCommunityId(v) ? v : null, ready: true }))
      .catch(() => set({ ready: true }))
  }
  return hydrating
}

export async function setCommunity(community: CommunityId | null): Promise<void> {
  set({ community, ready: true })
  try {
    if (community) await AsyncStorage.setItem(KEY, community)
    else await AsyncStorage.removeItem(KEY)
  } catch {
    /* storage unavailable: the choice just won't survive a restart */
  }
}

export function useCommunity(): { community: CommunityId | null; ready: boolean; setCommunity: typeof setCommunity } {
  useEffect(() => {
    void hydrate()
  }, [])
  const s = useSyncExternalStore(subscribe, snapshot, snapshot)
  return { community: s.community, ready: s.ready, setCommunity }
}

/** Communities that at least one Food or Mart store serves, in the order of the shared list. Empty until stores set them. */
export function useAvailableCommunities(): CommunityId[] {
  const food = useHubCatalog("food", true).data
  const mart = useHubCatalog("mart", true).data
  return useMemo(() => {
    const have = new Set<string>()
    for (const v of [...(food?.vendors || []), ...(mart?.vendors || [])]) for (const c of v.communities || []) have.add(c)
    return COMMUNITY_IDS.filter((c) => have.has(c))
  }, [food, mart])
}

/** True when the store serves the chosen community (or no community is chosen). */
export function vendorServesCommunity(v: Pick<HubVendor, "communities">, community: CommunityId | null): boolean {
  if (!community) return true
  return (v.communities || []).includes(community)
}
