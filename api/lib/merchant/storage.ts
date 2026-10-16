import { createServerClient } from "@/lib/supabase"
import { MerchantError } from "./errors"

export const ASSETS_BUCKET = "merchant-assets" // public: logos, covers, product images, expert photos
export const DOCUMENTS_BUCKET = "merchant-documents" // private: KYB files

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const DOC_TYPES = [...IMAGE_TYPES, "application/pdf"]
const IMAGE_MAX = 8 * 1024 * 1024
const DOC_MAX = 10 * 1024 * 1024

async function ensureBucket(id: string, isPublic: boolean, maxBytes: number, types: string[]) {
  const admin = createServerClient()
  const { data } = await admin.storage.listBuckets()
  if (data?.some((b) => b.id === id)) return
  const { error } = await admin.storage.createBucket(id, { public: isPublic, fileSizeLimit: maxBytes, allowedMimeTypes: types })
  if (error && !/already exists/i.test(error.message)) throw error
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" }

/** Signed direct-to-storage upload (avoids serverless body limits). Path is namespaced by merchant. */
export async function createSignedUpload(merchantId: string, kind: "image" | "document", mime: string, folder: string) {
  const isImage = kind === "image"
  const allowed = isImage ? IMAGE_TYPES : DOC_TYPES
  if (!allowed.includes(mime)) throw new MerchantError("UNSUPPORTED_FILE_TYPE", 400, { allowed })
  const bucket = isImage ? ASSETS_BUCKET : DOCUMENTS_BUCKET
  await ensureBucket(bucket, isImage, isImage ? IMAGE_MAX : DOC_MAX, allowed)
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "").slice(0, 32) || "misc"
  const path = `${merchantId}/${safeFolder}/${crypto.randomUUID()}.${EXT[mime]}`
  const admin = createServerClient()
  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path)
  if (error || !data) throw new MerchantError("UPLOAD_UNAVAILABLE", 503)
  const publicUrl = isImage ? admin.storage.from(bucket).getPublicUrl(path).data.publicUrl : null
  return { bucket, path, token: data.token, signedUrl: data.signedUrl, publicUrl, maxBytes: isImage ? IMAGE_MAX : DOC_MAX }
}

export async function signedDocumentUrl(path: string, seconds = 300): Promise<string | null> {
  const { data } = await createServerClient().storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, seconds)
  return data?.signedUrl ?? null
}

/** A file path is acceptable only inside the merchant's own folder. */
export function pathBelongsTo(merchantId: string, path: string): boolean {
  return path.startsWith(`${merchantId}/`) && !path.includes("..")
}
