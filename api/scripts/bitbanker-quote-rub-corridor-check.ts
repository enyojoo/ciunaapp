/**
 * RUB → local corridor preview (Office rate + Bitbanker B/G/U breakdown).
 *
 *   cd api && npx tsx scripts/bitbanker-quote-rub-corridor-check.ts
 *   SEND_AMOUNT=100000 RECEIVE=USD,NGN npx tsx scripts/bitbanker-quote-rub-corridor-check.ts
 */
import dotenv from "dotenv"

dotenv.config({ path: ".env" })

const sendAmount = Number(process.env.SEND_AMOUNT || "100000")
const corridors = (process.env.RECEIVE || "USD,NGN")
  .split(",")
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean)

async function show(receiveCurrency: string) {
  const { previewSendQuote } = await import("../lib/bitbanker/send-quote-service")
  const { exchangePrediction } = await import("../lib/bitbanker/prediction")

  const p = await previewSendQuote({
    userId: "",
    sendAmount,
    sendCurrency: "RUB",
    receiveCurrency,
  })
  const f = p.quoteSnapshot.localFunding
  const nominalB = f?.nominalInvoiceBaseB ?? p.invoiceBaseB
  const sbpUpliftOnB = Math.round((p.predictedGrossG - p.invoiceBaseB) * 100) / 100
  const extraBForUsdt = Math.round((p.invoiceBaseB - nominalB) * 100) / 100
  const predAtNominalB = await exchangePrediction({ volume: nominalB })
  const uAtNominalB = Number(predAtNominalB.volume_take_final)
  const sbpAtNominalB = Number(predAtNominalB.volume_give_prediction) - nominalB

  console.log(`\n=== RUB ${sendAmount.toLocaleString("en-US")} → ${receiveCurrency} ===`)
  console.log(
    JSON.stringify(
      {
        principalRub: p.sendAmount,
        recipientGets: p.receiveAmount,
        receiveCurrency: p.receiveCurrency,
        officeRubToLocalRate: p.exchangeRate,
        ciunaFeeRub: p.feeAmount,
        feeType: p.feeType,
        logisticsFeeRub: p.logisticsFeeAmount,
        paymentProcessingFeeRub_uiLine: p.paymentProcessingFee,
        feeBreakdown: {
          bitbankerSbpOnly_G_minus_B_atSolvedB: sbpUpliftOnB,
          pctOfSolvedB: `${((sbpUpliftOnB / p.invoiceBaseB) * 100).toFixed(2)}%`,
          extraRubInInvoiceB_notSbpFee: extraBForUsdt,
          whyExtraB: {
            usdtAtNominalB: uAtNominalB,
            usdtTarget: f?.usdtTargetWithReserves,
            usdtShortfallAtNominalB: f?.usdtTargetWithReserves
              ? Math.max(0, f.usdtTargetWithReserves - uAtNominalB)
              : null,
          },
          sbpIfWeOnlyUsedNominalB: Math.round(sbpAtNominalB * 100) / 100,
        },
        totalToPayRub_G: p.totalAmount,
        nominalInvoiceBaseB: nominalB,
        solvedInvoiceBaseB: p.invoiceBaseB,
        extraInvoiceB_forUsdtTarget: extraBForUsdt,
        bitbankerSbpUplift_on_B_rub: sbpUpliftOnB,
        predictedGrossG: p.predictedGrossG,
        usdtRequiredForLocal: f?.usdtRequiredForLocal,
        usdtTargetWithReserves: f?.usdtTargetWithReserves,
        usdtFromBitbankerU: p.predictedUsdtU,
        usdtDeskLocalPerUsdt: f?.usdtDeskLocalPerUnit,
        usdtDeskSource: f?.usdtDeskSource,
        check_U_gte_target:
          f?.usdtTargetWithReserves != null ? p.predictedUsdtU >= f.usdtTargetWithReserves : null,
      },
      null,
      2,
    ),
  )
}

async function main() {
  for (const c of corridors) {
    await show(c)
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
