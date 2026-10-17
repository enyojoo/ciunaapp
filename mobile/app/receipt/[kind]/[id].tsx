import { useCallback, useState } from "react"
import { Platform, Share, StyleSheet, Text, View } from "react-native"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"
import { receiptHtml } from "@/lib/receipt-html"
import { formatWhenZone } from "@/lib/format-date"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { BRAND } from "@ciuna/shared"
import { BadgeCheck } from "lucide-react-native"
import { EmptyState } from "@/components/empty-state"
import { LoadError } from "@/components/load-error"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { ApiError, authJson } from "@/lib/social-api"
import { formatMoney } from "@/lib/money"
import { useCachedQuery } from "@/lib/use-cached-query"
import { useToast } from "@/components/toast-provider"
import { NARROW_COLUMN } from "@/lib/layout-metrics"
import { colors, radius, type as typeSize } from "@/lib/theme"

type Receipt = {
  kind: "transfer" | "order" | "booking"
  number: string
  issuedAt: string
  status: "completed" | "paid" | "refunded"
  customer: { name: string | null }
  counterparty: { role: "recipient" | "store" | "expert"; name: string | null; account: string | null }
  payMethod: "online" | "bank" | null
  lines: { title: string; quantity: number; unitPrice: number; amount: number }[]
  amounts: { currency: string; items: number; fee: number; delivery: number; conversion: number; total: number; refunded: number | null }
  transfer: { sendAmount: number; sendCurrency: string; receiveAmount: number; receiveCurrency: string; rate: number } | null
  session: { start: string; end: string | null; timezone: string | null } | null
  address: string | null
}

/** A receipt for a completed transfer, a paid order, or a paid booking. Built on the server from the real record. */
export default function ReceiptScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>()
  const { t, i18n } = useTranslation("app")
  const { showError } = useToast()
  const [pdfBusy, setPdfBusy] = useState(false)
  const locale = i18n.resolvedLanguage || i18n.language || "en"
  const path = `/api/receipts/${encodeURIComponent(String(kind))}/${encodeURIComponent(String(id))}`
  const { data, loading, error, revalidate } = useCachedQuery<Receipt>(`ciuna_receipt_${kind}_${id}`, async () => (await authJson<{ receipt: Receipt }>(path)).receipt, { ttlMs: 60_000 })

  const when = useCallback(
    (iso: string, zone?: string | null) => {
      return formatWhenZone(iso, locale, zone) || iso
    },
    [locale],
  )

  if (loading && !data) return <View style={styles.skeleton} />
  if (!data) {
    const unavailable = error instanceof ApiError && error.code === "RECEIPT_UNAVAILABLE"
    return unavailable ? (
      <EmptyState title={t("receipt.title", { defaultValue: "Receipt" })} body={t("receipt.unavailable", { defaultValue: "A receipt is available once the payment is complete." })} />
    ) : (
      <LoadError onRetry={() => void revalidate()} />
    )
  }
  const r = data
  const money = (n: number) => formatMoney(n, r.amounts.currency)
  const counterpartyLabel = t(`receipt.${r.counterparty.role}`, { defaultValue: r.counterparty.role })

  const rows: { label: string; value: string }[] = [
    { label: t("receipt.customer", { defaultValue: "Customer" }), value: r.customer.name || "" },
    { label: counterpartyLabel, value: r.counterparty.name || "" },
    { label: t("receipt.account", { defaultValue: "Account" }), value: r.counterparty.account || "" },
    { label: t("receipt.session", { defaultValue: "Session" }), value: r.session ? when(r.session.start, r.session.timezone) + (r.session.timezone ? ` (${r.session.timezone})` : "") : "" },
    { label: t("receipt.address", { defaultValue: "Delivery address" }), value: r.address || "" },
    { label: t("receipt.paidWith", { defaultValue: "Paid with" }), value: r.payMethod ? t(`receipt.method_${r.payMethod}`, { defaultValue: r.payMethod }) : "" },
  ].filter((x) => x.value)

  const downloadPdf = async () => {
    setPdfBusy(true)
    try {
      const html = receiptHtml({
        brand: BRAND.name,
        number: r.number,
        date: when(r.issuedAt),
        status: t(`receipt.status_${r.status}`, { defaultValue: r.status }),
        statusTone: r.status === "refunded" ? "neutral" : "ok",
        rows,
        itemsTitle: r.lines.length ? t("receipt.items", { defaultValue: "Items" }) : undefined,
        items: r.lines.map((l) => ({ text: `${l.quantity} × ${l.title}`, amount: money(l.amount) })),
        totals: [
          ...(r.transfer && r.status !== "refunded" ? [{ label: t("receipt.rate", { defaultValue: "Rate" }), value: `1 ${r.transfer.sendCurrency} = ${r.transfer.rate} ${r.transfer.receiveCurrency}` }, { label: t("receipt.recipientGets", { defaultValue: "Recipient gets" }), value: formatMoney(r.transfer.receiveAmount, r.transfer.receiveCurrency) }] : []),
          ...(r.amounts.fee > 0 ? [{ label: r.transfer ? t("receipt.fee", { defaultValue: "Fee" }) : t("receipt.serviceFee", { defaultValue: "Service fee" }), value: money(r.amounts.fee) }] : []),
          ...(r.amounts.delivery > 0 ? [{ label: t("receipt.deliveryFee", { defaultValue: "Delivery fee" }), value: money(r.amounts.delivery) }] : []),
          ...(r.amounts.conversion > 0 ? [{ label: t("receipt.conversionFee", { defaultValue: "Conversion fee" }), value: money(r.amounts.conversion) }] : []),
          { label: t("receipt.total", { defaultValue: "Total paid" }), value: money(r.amounts.total), strong: true },
          ...(r.amounts.refunded != null ? [{ label: t("receipt.refunded", { defaultValue: "Refunded" }), value: `−${money(r.amounts.refunded)}` }] : []),
        ],
        footers: [t("receipt.notTax", { defaultValue: "This is not a tax invoice." }), t("receipt.support", { email: BRAND.email, defaultValue: "Questions? Write to {{email}}" })],
      })
      if (Platform.OS === "web") {
        await Print.printAsync({ html })
      } else {
        const { uri } = await Print.printToFileAsync({ html })
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: r.number, UTI: "com.adobe.pdf" })
      }
    } catch {
      showError(t("receipt.pdfFailed", { defaultValue: "Could not create the PDF. Try again." }))
    } finally {
      setPdfBusy(false)
    }
  }

  const shareText = t("receipt.shareText", { number: r.number, total: money(r.amounts.total), date: when(r.issuedAt), defaultValue: "Ciuna receipt {{number}}: {{total}} on {{date}}." })

  return (
    <ScreenScroll edges={["left", "right", "bottom"]} contentStyle={NARROW_COLUMN}>
      <View style={styles.plate}>
        <View style={styles.head}>
          <View style={styles.headText}>
            <Text style={styles.number}>{r.number}</Text>
            <Text style={styles.date}>{when(r.issuedAt)}</Text>
          </View>
          <View style={[styles.badge, r.status === "refunded" ? styles.badgeNeutral : styles.badgeOk]}>
            <BadgeCheck size={14} color={r.status === "refunded" ? colors.neutralText : colors.success} strokeWidth={2.4} />
            <Text style={[styles.badgeText, { color: r.status === "refunded" ? colors.neutralText : colors.successText }]}>{t(`receipt.status_${r.status}`, { defaultValue: r.status })}</Text>
          </View>
        </View>

        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}

        {r.lines.length > 0 ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>{t("receipt.items", { defaultValue: "Items" })}</Text>
            {r.lines.map((l, i) => (
              <View key={i} style={styles.line}>
                <Text style={styles.lineTitle} numberOfLines={2}>
                  {l.quantity} × {l.title}
                </Text>
                <Text style={styles.amount}>{money(l.amount)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {r.transfer && r.status !== "refunded" ? (
          <View style={styles.block}>
            <View style={styles.line}>
              <Text style={styles.lineTitle}>{t("receipt.rate", { defaultValue: "Rate" })}</Text>
              <Text style={styles.amount}>{`1 ${r.transfer.sendCurrency} = ${r.transfer.rate} ${r.transfer.receiveCurrency}`}</Text>
            </View>
            <View style={styles.line}>
              <Text style={styles.lineTitle}>{t("receipt.recipientGets", { defaultValue: "Recipient gets" })}</Text>
              <Text style={styles.amount}>{formatMoney(r.transfer.receiveAmount, r.transfer.receiveCurrency)}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.block}>
          {r.transfer || r.amounts.fee > 0 || r.amounts.delivery > 0 ? <Money label={r.transfer ? t("receipt.youSent", { defaultValue: "You sent" }) : t("receipt.items", { defaultValue: "Items" })} value={money(r.amounts.items)} /> : null}
          {r.amounts.fee > 0 ? <Money label={r.transfer ? t("receipt.fee", { defaultValue: "Fee" }) : t("receipt.serviceFee", { defaultValue: "Service fee" })} value={money(r.amounts.fee)} /> : null}
          {r.amounts.delivery > 0 ? <Money label={t("receipt.deliveryFee", { defaultValue: "Delivery fee" })} value={money(r.amounts.delivery)} /> : null}
          {r.amounts.conversion > 0 ? <Money label={t("receipt.conversionFee", { defaultValue: "Conversion fee" })} value={money(r.amounts.conversion)} /> : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("receipt.total", { defaultValue: "Total paid" })}</Text>
            <Text style={styles.totalValue}>{money(r.amounts.total)}</Text>
          </View>
          {r.amounts.refunded != null ? <Money label={t("receipt.refunded", { defaultValue: "Refunded" })} value={`−${money(r.amounts.refunded)}`} /> : null}
        </View>

        <Text style={styles.foot}>{t("receipt.notTax", { defaultValue: "This is not a tax invoice." })}</Text>
        <Text style={styles.foot}>{t("receipt.support", { email: BRAND.email, defaultValue: "Questions? Write to {{email}}" })}</Text>
      </View>
      <PrimaryButton label={t("receipt.downloadPdf", { defaultValue: "Download PDF" })} busy={pdfBusy} onPress={() => void downloadPdf()} />
      <View style={styles.gap} />
      <PrimaryButton label={t("receipt.share", { defaultValue: "Share receipt" })} variant="secondary" onPress={() => void Share.share({ message: shareText })} />
    </ScreenScroll>
  )
}

function Money({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineTitle}>{label}</Text>
      <Text style={styles.amount}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  skeleton: { margin: 16, height: 320, borderRadius: radius.card, backgroundColor: colors.paper },
  plate: { marginBottom: 16, padding: 16, gap: 12, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  headText: { flex: 1, minWidth: 0 },
  number: { fontSize: 18, fontWeight: "700", color: colors.text },
  date: { marginTop: 2, fontSize: typeSize.meta, color: colors.muted },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeOk: { backgroundColor: colors.successSurface },
  badgeNeutral: { backgroundColor: colors.neutralSurface },
  badgeText: { fontSize: 12, fontWeight: "700" },
  row: { gap: 2 },
  label: { fontSize: 12, fontWeight: "600", color: colors.muted },
  value: { fontSize: typeSize.body, color: colors.text },
  block: { gap: 8, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  blockTitle: { fontSize: 12, fontWeight: "600", color: colors.muted },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  lineTitle: { flex: 1, fontSize: typeSize.body, color: colors.text },
  amount: { fontSize: typeSize.body, fontWeight: "600", color: colors.text, fontVariant: ["tabular-nums"] },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: 20, fontWeight: "800", color: colors.text, fontVariant: ["tabular-nums"] },
  foot: { fontSize: 12, color: colors.muted },
  gap: { height: 10 },
})
