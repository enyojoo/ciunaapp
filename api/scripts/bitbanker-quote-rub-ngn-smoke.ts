/**
 * Ciuna quote path: RUB 10_000 → NGN (preview + firm leg-2).
 *   cd api && npx tsx scripts/bitbanker-quote-rub-ngn-smoke.ts
 */
import dotenv from "dotenv"
dotenv.config({ path: ".env" })

async function main() {
  const { previewSendQuote, computeSendQuoteBreakdown } = await import("../lib/bitbanker/send-quote-service")

  const preview = await previewSendQuote({
    userId: "",
    sendAmount: 10_000,
    sendCurrency: "RUB",
    receiveCurrency: "NGN",
  })

  console.log("=== Preview RUB 10_000 → NGN ===")
  console.log({
    sendAmount: preview.sendAmount,
    receiveAmount: preview.receiveAmount,
    corridorFeeRub: preview.feeAmount,
    bitbankerProcessingFeeRub: preview.paymentProcessingFee,
    totalToPayRubG: preview.totalAmount,
    invoiceBaseB: preview.invoiceBaseB,
    usdtFromBitbankerU: preview.predictedUsdtU,
    uiProcessingLine: preview.feeAmount + preview.paymentProcessingFee,
    leg2: preview.quoteSnapshot.leg2,
  })

  try {
    const firm = await computeSendQuoteBreakdown({
      userId: "",
      sendAmount: 10_000,
      sendCurrency: "RUB",
      receiveCurrency: "NGN",
      skipRecipientCheck: true,
      skipMinContributionCheck: false,
    })
    const leg2 = firm.quoteSnapshot.leg2
    console.log("=== Firm quote (leg-2 enforced) OK ===")
    console.log({
      totalToPayRubG: firm.totalAmount,
      usdtForLocalPayout: leg2?.usdtForLocalPayout,
      usdtDesk: leg2?.usdtDeskLocalPerUnit,
      deskSource: leg2?.usdtDeskSource,
      usdtFromBitbanker: leg2?.usdtFromBitbanker,
    })
  } catch (e) {
    console.log("=== Firm quote (leg-2 enforced) FAILED ===")
    console.log(e instanceof Error ? e.message : e)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
