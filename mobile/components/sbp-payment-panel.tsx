import { useEffect, useState } from "react"
import { Image, Linking, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { PrimaryButton } from "@/components/primary-button"
import { fetchWithAuth } from "@/lib/api"
import { formatCountdown } from "@/lib/countdown"
import { formatTimeZone } from "@/lib/format-date"
import { formatMoney } from "@/lib/money"
import { useCountdown } from "@/lib/use-countdown"
import { colors, radius, shadows, type as typeSize } from "@/lib/theme"

type Payment = { qrData: string | null; link: string | null; amount: number | null }

/**
 * Pay with SBP: the exact amount, the QR code beside it on wide screens, the deadline with its time zone and the
 * countdown that locks the rate. Polls until the payment lands (the parent refreshes the transfer).
 */
export function SbpPaymentPanel({ transactionId, totalRub, expiresAt, locale, wide }: { transactionId: string; totalRub: number; expiresAt?: string | null; locale: string; wide?: boolean }) {
  const { t } = useTranslation("app")
  const [payment, setPayment] = useState<Payment | null>(null)
  const left = useCountdown(expiresAt)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const res = await fetchWithAuth(`/api/send/transfers/${encodeURIComponent(transactionId)}/payment-status`)
      if (!res.ok || cancelled) return
      const body = (await res.json()) as { payment?: Partial<Payment> }
      if (body.payment) setPayment({ qrData: body.payment.qrData ?? null, link: body.payment.link ?? null, amount: body.payment.amount ?? null })
    }
    void load()
    const id = setInterval(() => void load(), 8000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [transactionId])

  const amount = payment?.amount ?? totalRub
  const urgent = left != null && left < 120_000
  return (
    <View style={[styles.card, wide && styles.cardWide]}>
      <View style={styles.info}>
        <Text style={styles.title}>{t("transferDetail.sbp.title", { defaultValue: "Pay with SBP" })}</Text>
        <Text style={styles.amountLabel}>{t("transferDetail.sbp.exact", { defaultValue: "Pay exactly" })}</Text>
        <Text style={styles.amount}>{formatMoney(amount, "RUB")}</Text>
        {expiresAt ? (
          <Text style={styles.deadline}>{t("transferDetail.sbp.deadline", { time: formatTimeZone(expiresAt, locale), defaultValue: "Pay before {{time}}." })}</Text>
        ) : null}
        {left != null ? (
          <View style={[styles.lock, urgent && styles.lockUrgent]} accessibilityLiveRegion="polite">
            <Text style={[styles.lockText, urgent && styles.lockTextUrgent]}>{t("transferDetail.sbp.locked", { time: formatCountdown(left), defaultValue: "Rate locked for {{time}}" })}</Text>
          </View>
        ) : null}
        <Text style={styles.scan}>{t("transferDetail.sbp.scan", { defaultValue: "Scan the QR code in your banking app and pay exactly this amount." })}</Text>
        {payment?.link ? (
          <View style={styles.openBtn}>
            <PrimaryButton label={t("transferDetail.sbp.openBank", { defaultValue: "Open my bank" })} variant="secondary" onPress={() => void Linking.openURL(payment.link as string)} />
          </View>
        ) : null}
      </View>
      {payment?.qrData ? <Image source={{ uri: payment.qrData }} style={styles.qr} accessibilityLabel={t("send.qrCodeAlt", { defaultValue: "Payment QR code" })} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: 14, padding: 16, gap: 16, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", ...shadows.face },
  cardWide: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  info: { flex: 1, minWidth: 0, gap: 6, alignSelf: "stretch" },
  title: { fontSize: typeSize.meta, fontWeight: "700", color: colors.text },
  amountLabel: { fontSize: typeSize.meta, color: colors.muted },
  amount: { fontSize: typeSize.largeTitle, fontWeight: "800", color: colors.text, fontVariant: ["tabular-nums"] },
  deadline: { fontSize: typeSize.meta, color: colors.muted },
  lock: { alignSelf: "flex-start", borderRadius: radius.pill, backgroundColor: colors.warningSurface, paddingHorizontal: 10, paddingVertical: 4, marginTop: 2 },
  lockUrgent: { backgroundColor: colors.dangerSurface },
  lockText: { fontSize: typeSize.caption, fontWeight: "700", color: colors.warningText, fontVariant: ["tabular-nums"] },
  lockTextUrgent: { color: colors.dangerText },
  scan: { marginTop: 4, fontSize: typeSize.meta, lineHeight: 20, color: colors.muted },
  openBtn: { marginTop: 8, maxWidth: 280 },
  qr: { width: 200, height: 200, borderRadius: radius.card },
})
