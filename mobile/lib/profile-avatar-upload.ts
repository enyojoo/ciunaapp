import { fetchWithAuth } from "@/lib/api"
import { supabase } from "@/lib/supabase"

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  let binary = ""
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function readImageBytes(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri)
  if (!res.ok) throw new Error("Could not read the photo.")
  const bytes = await res.arrayBuffer()
  if (!bytes.byteLength) throw new Error("Could not read the photo.")
  return bytes
}

/** Lists every object in the user's avatar folder and removes it, optionally skipping one path. */
async function removeAvatarObjects(userId: string, exceptPath?: string): Promise<void> {
  const { data: entries } = await supabase.storage.from("avatars").list(userId, { limit: 100 })
  const paths = (entries || [])
    .map((e) => (e.name ? `${userId}/${e.name}` : null))
    .filter((p): p is string => Boolean(p) && p !== exceptPath)
  if (paths.length) await supabase.storage.from("avatars").remove(paths)
}

async function uploadAvatarDirect(file: { uri: string; mimeType?: string | null }): Promise<{ url: string } | { error: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id
  const token = session?.access_token
  if (!userId || !token) return { error: "Sign in to upload." }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const apiKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !apiKey) return { error: "Upload is not configured." }

  const mime = file.mimeType && file.mimeType.startsWith("image/") ? file.mimeType : "image/jpeg"
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg"
  const path = `${userId}/avatar.${ext}`
  const bytes = await readImageBytes(file.uri)

  const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/avatars/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: apiKey,
      "Content-Type": mime,
      "x-upsert": "true",
    },
    body: bytes,
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
    return { error: body.message || body.error || "Upload failed." }
  }

  // A photo picked in a different format than last time lands at a different extension —
  // clean up any other file left behind so a user only ever has one avatar object in storage.
  await removeAvatarObjects(userId, path)

  const { data } = supabase.storage.from("avatars").getPublicUrl(path)
  const url = `${data.publicUrl}?v=${Date.now()}`
  const { error: updateError } = await supabase.from("users").update({ avatar_url: url }).eq("id", userId)
  if (updateError) return { error: updateError.message || "Could not save photo." }
  return { url }
}

export async function uploadProfileAvatar(file: {
  uri: string
  name?: string | null
  mimeType?: string | null
}): Promise<{ url: string } | { error: string }> {
  const mime = file.mimeType && file.mimeType.startsWith("image/") ? file.mimeType : "image/jpeg"

  try {
    const imageBase64 = arrayBufferToBase64(await readImageBytes(file.uri))
    const res = await fetchWithAuth("/api/upload/profile-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType: mime }),
    })
    if (res.status === 404) return uploadAvatarDirect(file)
    const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
    if (!res.ok) return { error: body.error || "Upload failed." }
    if (!body.url) return { error: "Upload failed." }
    return { url: body.url }
  } catch (e) {
    const fallback = await uploadAvatarDirect(file).catch((err) => ({
      error: err instanceof Error ? err.message : "Upload failed.",
    }))
    if ("url" in fallback) return fallback
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.toLowerCase().includes("network")) {
      return { error: "Could not reach the server. Check your connection and try again." }
    }
    return { error: fallback.error || msg || "Upload failed." }
  }
}

async function removeAvatarDirect(): Promise<{ ok: true } | { error: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return { error: "Sign in to remove your photo." }

  const { data: entries } = await supabase.storage.from("avatars").list(userId, { limit: 100 })
  const paths = (entries || [])
    .map((e) => (e.name ? `${userId}/${e.name}` : null))
    .filter((p): p is string => Boolean(p))
  if (paths.length) {
    const { error } = await supabase.storage.from("avatars").remove(paths)
    if (error) return { error: error.message || "Could not remove photo." }
  }
  const { error: updateError } = await supabase.from("users").update({ avatar_url: null }).eq("id", userId)
  if (updateError) return { error: updateError.message || "Could not remove photo." }
  return { ok: true }
}

export async function removeProfileAvatar(): Promise<{ ok: true } | { error: string }> {
  try {
    const res = await fetchWithAuth("/api/upload/profile-avatar", { method: "DELETE" })
    if (res.status === 404) return removeAvatarDirect()
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) return { error: body.error || "Could not remove photo." }
    return { ok: true }
  } catch {
    return removeAvatarDirect()
  }
}
