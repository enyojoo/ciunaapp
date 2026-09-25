import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
function encryptionKey() {
  const key = Buffer.from(process.env.MARKETPLACE_TOKEN_KEY || "", "base64")
  if (key.length !== 32) throw new Error("TOKEN_ENCRYPTION_UNAVAILABLE")
  return key
}
export function encryptToken(token: string, attemptId: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  cipher.setAAD(Buffer.from(attemptId))
  const out = Buffer.concat([cipher.update(token, "utf8"), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), out]).toString("base64")
}
export function decryptToken(value: string, attemptId: string) {
  const b = Buffer.from(value, "base64"),
    cipher = createDecipheriv("aes-256-gcm", encryptionKey(), b.subarray(0, 12))
  cipher.setAAD(Buffer.from(attemptId))
  cipher.setAuthTag(b.subarray(12, 28))
  return Buffer.concat([cipher.update(b.subarray(28)), cipher.final()]).toString("utf8")
}
