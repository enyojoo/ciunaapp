import { fetchWithAuth } from "@/lib/api"
import { supabase } from "@/lib/supabase"

async function readImageBytes(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri)
  if (!res.ok) throw new Error("Could not read the photo.")
  return res.arrayBuffer()
}

async function uploadAvatarDirect(file: {
  uri: string
  mimeType?: string | null
}): Promise<{ url: string } | { error: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return { error: "Sign in to upload." }

  const mime = file.mimeType && file.mimeType.startsWith("image/") ? file.mimeType : "image/jpeg"
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg"
  const bytes = await readImageBytes(file.uri)
  if (!bytes.byteLength) return { error: "Could not read the photo." }

  const path = `${userId}/avatar.${ext}`
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, bytes, {
    contentType: mime,
    upsert: true,
  })
  if (uploadError) return { error: uploadError.message || "Upload failed." }

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
  const type = file.mimeType && file.mimeType.startsWith("image/") ? file.mimeType : "image/jpeg"
  const name = file.name || `avatar_${Date.now()}.jpg`
  const form = new FormData()
  form.append("file", { uri: file.uri, name, type } as unknown as Blob)

  try {
    const res = await fetchWithAuth("/api/upload/profile-avatar", { method: "POST", body: form })
    if (res.status === 404) return uploadAvatarDirect(file)
    const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
    if (!res.ok) return { error: body.error || "Upload failed." }
    if (!body.url) return { error: "Upload failed." }
    return { url: body.url }
  } catch (e) {
    const fallback = await uploadAvatarDirect(file).catch(() => null)
    if (fallback && "url" in fallback) return fallback
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.toLowerCase().includes("network")) {
      return { error: "Could not reach the server. Check your connection and try again." }
    }
    return fallback && "error" in fallback ? fallback : { error: msg || "Upload failed." }
  }
}
