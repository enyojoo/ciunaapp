import "./web-crypto"
import { createClient } from "@supabase/supabase-js"
import { supabaseAuthStorage } from "./secure-storage"

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://placeholder.supabase.co"
/** Prefer the classic anon JWT on native; publishable keys can 401 password grants in Expo Go. */
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "public-anon-placeholder"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseAuthStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
  global: {
    headers: {
      "X-Client-Info": "ciuna-mobile-app",
    },
  },
})

/** Stale simulator storage after an env switch otherwise surfaces as a failed login. */
export async function clearInvalidPersistedAuthSession(): Promise<void> {
  const { error } = await supabase.auth.getSession()
  if (!error) return
  const msg = `${error.message || ""} ${(error as { code?: string }).code || ""}`.toLowerCase()
  if (msg.includes("refresh") || msg.includes("invalid jwt") || msg.includes("jwt expired")) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined)
  }
}
