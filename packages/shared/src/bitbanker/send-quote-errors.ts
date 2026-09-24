/** Stable API error codes for Bitbanker send quotes (firm + preview). */
export const SEND_QUOTE_ERROR_CODE = {
  DESK_RATE_NOT_CONFIGURED: "desk_rate_not_configured",
  MIN_CONTRIBUTION: "min_contribution",
  MIN_SEND_AMOUNT: "min_send_amount",
  RATE_UNAVAILABLE: "rate_unavailable",
  PREDICTION_UNAVAILABLE: "prediction_unavailable",
} as const

export type SendQuoteErrorCode = (typeof SEND_QUOTE_ERROR_CODE)[keyof typeof SEND_QUOTE_ERROR_CODE]

const CODE_TO_I18N: Record<SendQuoteErrorCode, string> = {
  [SEND_QUOTE_ERROR_CODE.DESK_RATE_NOT_CONFIGURED]: "send.quoteDeskRateNotConfigured",
  [SEND_QUOTE_ERROR_CODE.MIN_CONTRIBUTION]: "send.quoteMinContribution",
  [SEND_QUOTE_ERROR_CODE.MIN_SEND_AMOUNT]: "send.mobile.quoteBelowMinRub",
  [SEND_QUOTE_ERROR_CODE.RATE_UNAVAILABLE]: "send.rateUnavailable",
  [SEND_QUOTE_ERROR_CODE.PREDICTION_UNAVAILABLE]: "send.mobile.quoteFeesUnavailable",
}

export function i18nKeyForSendQuoteErrorCode(code: string | undefined | null): string | null {
  if (!code) return null
  return CODE_TO_I18N[code as SendQuoteErrorCode] ?? null
}

export function i18nKeyForSendQuoteErrorMessage(message: string): string | null {
  const lower = message.trim().toLowerCase()
  if (
    lower.includes("corridor usdt desk rate") ||
    (lower.includes("usd to ") && lower.includes("exchange rate is not configured"))
  ) {
    return CODE_TO_I18N[SEND_QUOTE_ERROR_CODE.DESK_RATE_NOT_CONFIGURED]
  }
  if (lower.includes("minimum contribution")) {
    return CODE_TO_I18N[SEND_QUOTE_ERROR_CODE.MIN_CONTRIBUTION]
  }
  if (lower.includes("minimum send amount")) {
    return CODE_TO_I18N[SEND_QUOTE_ERROR_CODE.MIN_SEND_AMOUNT]
  }
  if (lower.includes("exchange rate not available") || lower.includes("invalid exchange rate")) {
    return CODE_TO_I18N[SEND_QUOTE_ERROR_CODE.RATE_UNAVAILABLE]
  }
  if (lower.includes("prediction unavailable")) {
    return CODE_TO_I18N[SEND_QUOTE_ERROR_CODE.PREDICTION_UNAVAILABLE]
  }
  return null
}
