import { i18nKeyForSendQuoteErrorCode, i18nKeyForSendQuoteErrorMessage } from "@ciuna/shared"

export type SendQuotePreviewNotice = {
  kind: "info" | "warning"
  messageKey: string
  messageParams?: Record<string, string | number>
}

const RAW_NETWORK = /fetch failed|network request failed|failed to fetch|load failed/i

export function noticeForQuotePreviewFailure(
  status: number,
  apiError?: string | null,
  errorCode?: string | null,
): SendQuotePreviewNotice {
  const fromCode = i18nKeyForSendQuoteErrorCode(errorCode)
  if (fromCode) {
    return {
      kind: fromCode.includes("BelowMin") || fromCode.includes("MinContribution") ? "warning" : "info",
      messageKey: fromCode,
    }
  }

  const err = String(apiError || "").trim()
  const fromMessage = i18nKeyForSendQuoteErrorMessage(err)
  if (fromMessage) {
    return {
      kind: fromMessage.includes("BelowMin") || fromMessage.includes("MinContribution") ? "warning" : "info",
      messageKey: fromMessage,
    }
  }

  const lower = err.toLowerCase()
  if (status === 403 || lower.includes("verification")) {
    return { kind: "warning", messageKey: "send.mobile.verifyRequired" }
  }
  if (lower.includes("bitbanker is not configured") || status === 503) {
    return { kind: "info", messageKey: "send.mobile.quoteFeesUnavailable" }
  }
  return { kind: "info", messageKey: "send.mobile.quoteFeesUnavailable" }
}

export function noticeForQuotePreviewNetworkFailure(): SendQuotePreviewNotice {
  return { kind: "info", messageKey: "send.mobile.quoteFeesUnavailable" }
}

export function isRawNetworkError(message: string): boolean {
  return RAW_NETWORK.test(message.trim())
}
