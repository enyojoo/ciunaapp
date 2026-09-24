import {
  i18nKeyForSendQuoteErrorMessage,
  SEND_QUOTE_ERROR_CODE,
  type SendQuoteErrorCode,
} from "@ciuna/shared"

export { SEND_QUOTE_ERROR_CODE, type SendQuoteErrorCode }

export class SendQuoteError extends Error {
  readonly code: SendQuoteErrorCode

  constructor(code: SendQuoteErrorCode, message: string) {
    super(message)
    this.name = "SendQuoteError"
    this.code = code
  }
}

const MESSAGE_TO_CODE: Record<string, SendQuoteErrorCode> = {
  "Corridor USDT desk rate is not configured": SEND_QUOTE_ERROR_CODE.DESK_RATE_NOT_CONFIGURED,
  "Quote does not meet minimum contribution for this corridor": SEND_QUOTE_ERROR_CODE.MIN_CONTRIBUTION,
  "Exchange rate not available": SEND_QUOTE_ERROR_CODE.RATE_UNAVAILABLE,
  "Invalid exchange rate": SEND_QUOTE_ERROR_CODE.RATE_UNAVAILABLE,
  "Bitbanker prediction unavailable": SEND_QUOTE_ERROR_CODE.PREDICTION_UNAVAILABLE,
}

export function sendQuoteErrorResponse(error: unknown) {
  if (error instanceof SendQuoteError) {
    return { message: error.message, code: error.code, status: 400 as const }
  }
  const message = error instanceof Error ? error.message : "Failed to create quote"
  let code: SendQuoteErrorCode | undefined = MESSAGE_TO_CODE[message]
  const lower = message.toLowerCase()
  if (
    !code &&
    lower.includes("usd to ") &&
    lower.includes("exchange rate is not configured")
  ) {
    code = SEND_QUOTE_ERROR_CODE.DESK_RATE_NOT_CONFIGURED
  }
  if (!code && i18nKeyForSendQuoteErrorMessage(message)) {
    code =
      message.toLowerCase().includes("minimum send amount")
        ? SEND_QUOTE_ERROR_CODE.MIN_SEND_AMOUNT
        : undefined
  }
  return { message, code, status: 400 as const }
}
