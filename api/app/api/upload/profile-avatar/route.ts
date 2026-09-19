import { NextRequest, NextResponse } from "next/server"
import { requireUser, createErrorResponse, withErrorHandling } from "@/lib/auth-utils"
import { createServerClient } from "@/lib/supabase"

const BUCKET = "avatars"
const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"])

function extForMime(mime: string): string {
  if (mime.includes("png")) return "png"
  if (mime.includes("webp")) return "webp"
  if (mime.includes("heic") || mime.includes("heif")) return "heic"
  return "jpg"
}

async function readUpload(request: NextRequest): Promise<{ bytes: Buffer; mime: string } | { error: string; status: number }> {
  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { imageBase64?: string; mimeType?: string } | null
    const raw = typeof body?.imageBase64 === "string" ? body.imageBase64 : ""
    const b64 = raw.includes(",") ? raw.slice(raw.indexOf(",") + 1) : raw
    if (!b64) return { error: "Image is required.", status: 400 }
    const mime = (body?.mimeType || "image/jpeg").toLowerCase()
    if (!ALLOWED.has(mime)) return { error: "Use a JPEG, PNG, or WebP photo.", status: 400 }
    const bytes = Buffer.from(b64, "base64")
    if (!bytes.length) return { error: "Could not read the photo.", status: 400 }
    return { bytes, mime }
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return { error: "Invalid upload.", status: 400 }
  }
  const file = form.get("file")
  if (!file || typeof file === "string") return { error: "Image is required.", status: 400 }
  const rawType = (file.type || "image/jpeg").toLowerCase()
  const mime = rawType === "application/octet-stream" || rawType === "application/octet-stream;" ? "image/jpeg" : rawType
  if (!ALLOWED.has(mime)) return { error: "Use a JPEG, PNG, or WebP photo.", status: 400 }
  const bytes = Buffer.from(await file.arrayBuffer())
  if (!bytes.length) return { error: "Could not read the photo.", status: 400 }
  return { bytes, mime }
}

async function ensureAvatarsBucket(admin: ReturnType<typeof createServerClient>) {
  const { data: buckets } = await admin.storage.listBuckets()
  if (buckets?.some((b) => b.id === BUCKET)) return
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
  })
  if (error && !/already exists/i.test(error.message)) {
    throw error
  }
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  const parsed = await readUpload(request)
  if ("error" in parsed) return createErrorResponse(parsed.error, parsed.status)
  if (parsed.bytes.length > MAX_BYTES) return createErrorResponse("Photo must be 2MB or smaller.", 400)

  const admin = createServerClient()
  await ensureAvatarsBucket(admin)

  const path = `${user.id}/avatar.${extForMime(parsed.mime)}`
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, parsed.bytes, {
    contentType: parsed.mime === "image/jpg" ? "image/jpeg" : parsed.mime,
    upsert: true,
  })
  if (uploadError) {
    console.error("profile-avatar upload:", uploadError)
    return createErrorResponse(uploadError.message || "Upload failed.", 500)
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  const url = `${data.publicUrl}?v=${Date.now()}`

  const { error: updateError } = await admin.from("users").update({ avatar_url: url }).eq("id", user.id)
  if (updateError) {
    console.error("profile-avatar users update:", updateError)
    return createErrorResponse(updateError.message || "Could not save photo.", 500)
  }

  return NextResponse.json({ url })
})

async function removeUserAvatarObjects(admin: ReturnType<typeof createServerClient>, userId: string) {
  const { data: entries } = await admin.storage.from(BUCKET).list(userId, { limit: 100 })
  const paths = (entries || [])
    .map((e) => (e.name ? `${userId}/${e.name}` : null))
    .filter((p): p is string => Boolean(p))
  if (paths.length) await admin.storage.from(BUCKET).remove(paths)
}

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  const admin = createServerClient()
  await removeUserAvatarObjects(admin, user.id)
  const { error: updateError } = await admin.from("users").update({ avatar_url: null }).eq("id", user.id)
  if (updateError) {
    console.error("profile-avatar users clear:", updateError)
    return createErrorResponse(updateError.message || "Could not remove photo.", 500)
  }
  return NextResponse.json({ ok: true })
})
