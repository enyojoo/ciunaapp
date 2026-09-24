import { Pressable, StyleSheet, Text, View } from "react-native"
import { CreditCard, Landmark } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { YooKassaCheckoutWidget } from "@/components/yookassa-checkout-widget"
import { colors, radius, type as typeSize } from "@/lib/theme"

/** Shared mobile Hub + Experts pay rails + Expo-web inline widget mount. */
export function CheckoutPayRails({
  yookassaEnabled,
  sendCurrency,
  payChoice,
  onPayChoice,
  onlinePayment,
  onCompleted,
  onFailed,
  onSwitchToManual,
}: {
  yookassaEnabled: boolean
  sendCurrency: string
  payChoice: "manual" | "yookassa"
  onPayChoice: (c: "manual" | "yookassa") => void
  onlinePayment: { transactionId: string; confirmationToken: string | null } | null
  onCompleted: (transactionId: string) => void
  onFailed: (message: string) => void
  onSwitchToManual: () => void
}) {
  const { t } = useTranslation("app")
  const showRails = yookassaEnabled && sendCurrency.toUpperCase() === "RUB" && !onlinePayment

  return (
    <>
      {showRails ? (
        <View style={styles.payChoiceRow}>
          <Pressable
            onPress={() => onPayChoice("manual")}
            style={[styles.payChoice, payChoice === "manual" && styles.payChoiceActive]}
          >
            <Landmark size={18} color={payChoice === "manual" ? colors.primary : colors.muted} />
            <Text style={[styles.payChoiceText, payChoice === "manual" && styles.payChoiceTextActive]}>
              {t("hub.checkout.payManual", { defaultValue: "Bank transfer" })}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onPayChoice("yookassa")}
            style={[styles.payChoice, payChoice === "yookassa" && styles.payChoiceActive]}
          >
            <CreditCard size={18} color={payChoice === "yookassa" ? colors.primary : colors.muted} />
            <Text style={[styles.payChoiceText, payChoice === "yookassa" && styles.payChoiceTextActive]}>
              {t("hub.checkout.payOnline", { defaultValue: "Pay online" })}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {onlinePayment ? (
        <View style={styles.onlineBlock}>
          <Text style={styles.hint}>
            {t("hub.checkout.onlinePayInlineHint", {
              defaultValue: "Complete payment by card or SBP below.",
            })}
          </Text>
          <YooKassaCheckoutWidget
            transactionId={onlinePayment.transactionId}
            confirmationToken={onlinePayment.confirmationToken}
            onCompleted={onCompleted}
            onFailed={onFailed}
          />
          <Pressable onPress={onSwitchToManual} style={styles.switchManual}>
            <Text style={styles.payChoiceTextActive}>
              {t("hub.checkout.payManual", { defaultValue: "Bank transfer" })}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  payChoiceRow: { flexDirection: "row", gap: 10 },
  payChoice: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  payChoiceActive: { borderColor: colors.primary, backgroundColor: "#FFF7ED" },
  payChoiceText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.muted },
  payChoiceTextActive: { color: colors.primary },
  onlineBlock: { gap: 12 },
  hint: { fontSize: typeSize.meta, color: colors.muted },
  switchManual: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
})
