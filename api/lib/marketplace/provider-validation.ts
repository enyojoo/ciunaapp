/** A webhook is only a hint: callers supply a payment fetched with merchant credentials. */
export function providerPaymentMatches(
  payment: any,
  attempt: {
    id: string
    rail: string
    provider_id?: string | null
    amount: number | string
    currency: string
  },
  orderId: string,
  shopId: string | undefined,
): boolean {
  return (
    attempt.rail === "yookassa" &&
    typeof payment?.id === "string" &&
    payment.id.length > 0 &&
    ["pending", "waiting_for_capture", "succeeded", "canceled"].includes(payment.status) &&
    payment.metadata?.attemptId === attempt.id &&
    payment.metadata?.orderId === orderId &&
    !!shopId &&
    payment.recipient?.account_id === shopId &&
    payment.amount?.currency === attempt.currency &&
    Number.isFinite(Number(payment.amount?.value)) &&
    Number(payment.amount.value) === Number(attempt.amount) &&
    (!attempt.provider_id || attempt.provider_id === payment.id)
  )
}
