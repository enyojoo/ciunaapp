import { Platform } from "react-native"
import { makeRedirectUri } from "expo-auth-session"

/** OAuth return URL for Supabase `signInWithOAuth`. Native: `ciuna://auth/callback`. */
export function getOAuthRedirectUri(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`
  }
  return makeRedirectUri({ scheme: "ciuna", path: "auth/callback" })
}
