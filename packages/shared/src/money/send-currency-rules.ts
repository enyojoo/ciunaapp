/** Minimal currency row for send/receive picker rules (Office `can_send` / `can_receive`). */
export type SendCurrencyOption = {
  code: string
  can_send?: boolean
  can_receive?: boolean
}

function norm(code: string): string {
  return code.trim().toUpperCase()
}

export function currenciesForSendPicker(
  currencies: SendCurrencyOption[],
  receiveCurrency: string,
): SendCurrencyOption[] {
  const recv = norm(receiveCurrency)
  return currencies.filter((c) => c.can_send !== false && norm(c.code) !== recv)
}

export function currenciesForReceivePicker(
  currencies: SendCurrencyOption[],
  sendCurrency: string,
): SendCurrencyOption[] {
  const send = norm(sendCurrency)
  return currencies.filter((c) => c.can_receive !== false && norm(c.code) !== send)
}

export function defaultSendCurrency(
  currencies: SendCurrencyOption[],
  preferredBase?: string | null,
): string | null {
  const sendable = currencies.filter((c) => c.can_send !== false)
  if (sendable.length === 0) return null
  const base = preferredBase ? norm(preferredBase) : ""
  if (base && sendable.some((c) => norm(c.code) === base)) {
    return sendable.find((c) => norm(c.code) === base)!.code
  }
  const usd = sendable.find((c) => norm(c.code) === "USD")
  return usd ? usd.code : sendable[0].code
}

export function defaultReceiveCurrency(
  currencies: SendCurrencyOption[],
  sendCurrency: string,
): string | null {
  const list = currenciesForReceivePicker(currencies, sendCurrency)
  if (list.length === 0) return null
  const ngn = list.find((c) => norm(c.code) === "NGN")
  return ngn ? ngn.code : list[0].code
}

/** After send currency changes — keep receive valid and different from send. */
export function applySendCurrencyChange(
  currencies: SendCurrencyOption[],
  newSend: string,
  receiveCurrency: string,
): { sendCurrency: string; receiveCurrency: string } {
  const sendCurrency = newSend
  let receive = receiveCurrency
  if (norm(sendCurrency) === norm(receive)) {
    receive = defaultReceiveCurrency(currencies, sendCurrency) ?? receive
  } else {
    const cur = currencies.find((c) => norm(c.code) === norm(receive))
    if (cur?.can_receive === false) {
      receive = defaultReceiveCurrency(currencies, sendCurrency) ?? receive
    }
  }
  return { sendCurrency, receiveCurrency: receive }
}

/** After receive currency changes — keep send valid and different from receive. */
export function applyReceiveCurrencyChange(
  currencies: SendCurrencyOption[],
  sendCurrency: string,
  newReceive: string,
): { sendCurrency: string; receiveCurrency: string } {
  let send = sendCurrency
  const receiveCurrency = newReceive
  if (norm(receiveCurrency) === norm(send)) {
    const sendable = currenciesForSendPicker(currencies, receiveCurrency)
    send = sendable[0]?.code ?? send
  }
  return { sendCurrency: send, receiveCurrency }
}

/** When currency list or Office flags change, fix receive if it can no longer receive. */
export function ensureValidReceiveCurrency(
  currencies: SendCurrencyOption[],
  sendCurrency: string,
  receiveCurrency: string,
): string {
  const cur = currencies.find((c) => norm(c.code) === norm(receiveCurrency))
  if (
    cur &&
    cur.can_receive !== false &&
    norm(cur.code) !== norm(sendCurrency)
  ) {
    return receiveCurrency
  }
  return defaultReceiveCurrency(currencies, sendCurrency) ?? receiveCurrency
}

export function initialSendReceivePair(
  currencies: SendCurrencyOption[],
  preferredBase?: string | null,
): { sendCurrency: string; receiveCurrency: string } | null {
  const sendCurrency = defaultSendCurrency(currencies, preferredBase)
  if (!sendCurrency) return null
  const receiveCurrency = defaultReceiveCurrency(currencies, sendCurrency)
  if (!receiveCurrency) return null
  return { sendCurrency, receiveCurrency }
}
