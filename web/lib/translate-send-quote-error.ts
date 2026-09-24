import { i18nKeyForSendQuoteErrorCode, i18nKeyForSendQuoteErrorMessage } from "@ciuna/shared"
import type { TFunction } from "i18next"

export function translateSendQuoteError(
  t: TFunction,
  message: string,
  errorCode?: string | null,
): string {
  const key = i18nKeyForSendQuoteErrorCode(errorCode) ?? i18nKeyForSendQuoteErrorMessage(message)
  if (key) return t(key, { defaultValue: message })
  return message
}
