import { MerchantError } from "./merchant/errors"

/** Turns the database's answer to cancel_transfer into success or a coded error the app can explain. */
export function interpretCancel(result: any): void {
  if (result?.ok) return
  const code = String(result?.error || "TRANSFER_CANCEL_FAILED")
  const status = code === "TRANSFER_NOT_FOUND" ? 404 : code === "TRANSFER_NOT_CANCELLABLE" ? 409 : 400
  throw new MerchantError(code, status)
}
