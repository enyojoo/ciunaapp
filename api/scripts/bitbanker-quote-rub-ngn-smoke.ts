/**
 * RUB 10_000 → NGN preview: recipient amount + minimal B so Bitbanker U covers local payout.
 *   cd api && npx tsx scripts/bitbanker-quote-rub-ngn-smoke.ts
 */
import dotenv from "dotenv"
dotenv.config({ path: ".env" })

async function main() {
  const { previewSendQuote } = await import("../lib/bitbanker/send-quote-service")

  const preview = await previewSendQuote({
    userId: "",
    sendAmount: 10_000,
    sendCurrency: "RUB",
    receiveCurrency: "NGN",
  })

  const funding = preview.quoteSnapshot.localFunding

  console.log("=== Bitbanker quote RUB 10_000 → NGN (amount step) ===")
  console.log({
    principalRub: preview.sendAmount,
    recipientGetsNgn: preview.receiveAmount,
    rubToNgnRate: preview.exchangeRate,
    ciunaFeeRub: preview.feeAmount,
    processingFeeRub: preview.paymentProcessingFee,
    totalToPayRubG: preview.totalAmount,
    nominalInvoiceBaseB: funding?.nominalInvoiceBaseB,
    solvedInvoiceBaseB: preview.invoiceBaseB,
    usdtRequiredForLocal: funding?.usdtRequiredForLocal,
    usdtTargetWithReserves: funding?.usdtTargetWithReserves,
    usdtFromBitbankerU: preview.predictedUsdtU,
    usdtDeskLocalPerUsdt: funding?.usdtDeskLocalPerUnit,
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
