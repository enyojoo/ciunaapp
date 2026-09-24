export const KYC_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "application/pdf"])
const ALLOWED_EXT = /\.(jpe?g|png|pdf)$/i

export type KycPickedDocument = {
  uri: string
  name: string
  type: string
  size?: number
}

export function isPdfMime(type: string): boolean {
  return type === "application/pdf" || type.endsWith("/pdf")
}

export function isImageMime(type: string): boolean {
  return type.startsWith("image/")
}

export function validateKycDocumentFile(
  file: Pick<KycPickedDocument, "name" | "type" | "size">,
): "ok" | "too_large" | "invalid_type" {
  const type = file.type?.toLowerCase() || ""
  const name = file.name || ""
  const byMime = type && ALLOWED_MIME.has(type)
  const byExt = ALLOWED_EXT.test(name)
  if (!byMime && !byExt) return "invalid_type"
  if (file.size != null && file.size > KYC_DOCUMENT_MAX_BYTES) return "too_large"
  return "ok"
}
