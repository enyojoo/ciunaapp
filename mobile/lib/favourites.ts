import { useCallback, useEffect, useSyncExternalStore } from "react"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { useToast } from "@/components/toast-provider"
import { useAuth } from "@/lib/auth-context"
import { authJson } from "@/lib/social-api"
import type { ExpertProfile, HubProduct, HubVendor } from "@/lib/types"

export type FavouriteType = "vendor" | "expert" | "product"

export type FavouritesData = {
  keys: string[]
  vendors: HubVendor[]
  experts: ExpertProfile[]
  products: HubProduct[]
  /** The favourites table is not applied on this database yet: hearts are hidden. */
  unavailable?: boolean
}

type State = { userId: string | null; data: FavouritesData | null; loading: boolean; failed: boolean }

let state: State = { userId: null, data: null, loading: false, failed: false }
let inflight: Promise<void> | null = null
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

const keyOf = (type: FavouriteType, id: string) => `${type}:${id}`

/** Load (or reload) the signed-in user's favourites. Deduped; a failure leaves earlier data in place. */
export function loadFavourites(userId: string, opts?: { force?: boolean }): Promise<void> {
  if (state.userId === userId && state.data && !opts?.force) return Promise.resolve()
  if (inflight) return inflight
  if (state.userId !== userId) set({ userId, data: null, failed: false })
  set({ loading: true })
  inflight = authJson<Partial<FavouritesData>>("/api/hub/favorites")
    .then((body) =>
      set({
        data: {
          keys: body.keys || [],
          vendors: body.vendors || [],
          experts: body.experts || [],
          products: body.products || [],
          unavailable: Boolean(body.unavailable),
        },
        failed: false,
        loading: false,
      }),
    )
    .catch(() => set({ failed: true, loading: false }))
    .finally(() => {
      inflight = null
    })
  return inflight
}

export function resetFavourites() {
  set({ userId: null, data: null, loading: false, failed: false })
}

function patchKeys(fn: (keys: string[]) => string[]) {
  const data = state.data || { keys: [], vendors: [], experts: [], products: [] }
  set({ data: { ...data, keys: fn(data.keys) } })
}

/**
 * Favourites for hearts and the Favourites screen. Toggling is optimistic: the heart flips at once and
 * is put back (with a calm toast) if the server refuses.
 */
export function useFavourites() {
  const { t } = useTranslation("app")
  const { user } = useAuth()
  const router = useRouter()
  const { showToast, showError } = useToast()
  const s = useSyncExternalStore(subscribe, snapshot, snapshot)
  const userId = user?.id ?? null

  useEffect(() => {
    if (!userId) {
      if (state.userId) resetFavourites()
      return
    }
    void loadFavourites(userId)
  }, [userId])

  const isFav = useCallback(
    (type: FavouriteType, id: string) => Boolean(s.data?.keys.includes(keyOf(type, id))),
    [s.data],
  )

  const toggle = useCallback(
    async (type: FavouriteType, id: string) => {
      if (!userId) {
        router.push("/auth/login" as never)
        return
      }
      const key = keyOf(type, id)
      const wasOn = Boolean(state.data?.keys.includes(key))
      patchKeys((keys) => (wasOn ? keys.filter((k) => k !== key) : [key, ...keys]))
      try {
        await authJson("/api/hub/favorites", { method: wasOn ? "DELETE" : "PUT", body: { type, id } })
        if (wasOn) {
          showToast(t("favourites.removed", { defaultValue: "Removed from favourites" }), "info", 5000, {
            label: t("favourites.undo", { defaultValue: "Undo" }),
            onPress: () => void toggle(type, id),
          })
        }
      } catch {
        patchKeys((keys) => (wasOn ? [key, ...keys] : keys.filter((k) => k !== key)))
        showError(t("favourites.saveFailed", { defaultValue: "Couldn't update favourites. Try again." }))
      }
    },
    [userId, router, showToast, showError, t],
  )

  const reload = useCallback(() => (userId ? loadFavourites(userId, { force: true }) : Promise.resolve()), [userId])

  return {
    signedIn: Boolean(userId),
    unavailable: Boolean(s.data?.unavailable),
    data: s.data,
    loading: s.loading && !s.data,
    failed: s.failed && !s.data,
    isFav,
    toggle,
    reload,
  }
}
