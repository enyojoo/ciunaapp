import { roundMoney } from "../money/round"

export type BitbankerQuotePreviewShape = {
  sendAmount: number
  sendCurrency?: string
  receiveCurrency?: string
}

export const BITBANKER_QUOTE_PREVIEW_DEBOUNCE_MS = 120

export function bitbankerQuotePreviewMatchesInput(
  preview: BitbankerQuotePreviewShape | null | undefined,
  input: { sendAmount: number; sendCurrency: string; receiveCurrency: string },
): boolean {
  if (!preview) return false
  if (roundMoney(preview.sendAmount) !== roundMoney(input.sendAmount)) return false
  const sendCurrency = input.sendCurrency.trim().toUpperCase()
  const receiveCurrency = input.receiveCurrency.trim().toUpperCase()
  const previewSend = preview.sendCurrency?.trim().toUpperCase()
  const previewReceive = preview.receiveCurrency?.trim().toUpperCase()
  if (previewSend && previewSend !== sendCurrency) return false
  if (previewReceive && previewReceive !== receiveCurrency) return false
  return true
}
