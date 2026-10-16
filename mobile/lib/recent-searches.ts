import AsyncStorage from "@react-native-async-storage/async-storage"

const KEY = "ciuna_recent_searches"
const MAX = 8

/** Device-local recent searches, newest first. Never throws. */
export async function readRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string").slice(0, MAX) : []
  } catch {
    return []
  }
}

export async function addRecentSearch(term: string): Promise<string[]> {
  const clean = term.trim()
  if (clean.length < 2) return readRecentSearches()
  const current = await readRecentSearches()
  const next = [clean, ...current.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, MAX)
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable: the list just won't persist */
  }
  return next
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
