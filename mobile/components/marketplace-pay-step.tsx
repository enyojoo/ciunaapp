import { useRef } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import * as DocumentPicker from "expo-document-picker"
import { Check, CreditCard, Landmark, Upload, X } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import type { MarketplaceMethod } from "@ciuna/shared"
import { YooKassaCheckoutWidget } from "@/components/yookassa-checkout-widget"
import { OnlinePaySkeleton } from "@/components/online-pay-skeleton"
import { PrimaryButton } from "@/components/primary-button"
import { colors, radius, space, type as typeSize, ui } from "@/lib/theme"
import type { MarketplacePayTab } from "./marketplace-pay-types"

export type { MarketplacePayTab }

type ReceiptAsset = {
  uri: string
  name: string
  mimeType?: string | null
  size?: number | null
}

type Props = {
  methods: MarketplaceMethod[]
  payTab: MarketplacePayTab
  onPayTab: (tab: MarketplacePayTab) => void
  methodId: string
  onMethodId: (id: string) => void
  amount: number
  currency: string
  amountLabel: string
  reference?: string | null
  onlinePayment?: { transactionId: string; confirmationToken: string | null } | null
  proofSubmitted?: boolean
  receiptFile: ReceiptAsset | null
  onReceiptFile: (file: ReceiptAsset | null) => void
  busy: boolean
  canAct: boolean
  onPay: () => void
  onIvePaid: () => void
  onWidgetCompleted: () => void
  onWidgetFailed: () => void
  hideOnlineCta?: boolean
  onNativePay?: () => void
  showNativePay?: boolean
  /** True while creating the YooKassa attempt so the frame shows a spinner, not “tap Pay”. */
  onlineCreating?: boolean
}

function InstructionRows({
  instructions,
  reference,
}: {
  instructions: Record<string, unknown>
  reference?: string | null
}) {
  const { t } = useTranslation("app")
  const entries = Object.entries(instructions).filter(
    ([k, v]) => !["type", "name"].includes(k) && v != null && String(v).trim() !== "",
  )
  return (
    <View style={styles.instructionCard}>
      {entries.map(([k, v]) => (
        <View key={k} style={styles.instructionRow}>
          <Text style={styles.instructionLabel}>
            {t(`marketplace.instructionsLabels.${k}`, {
              defaultValue: k.replaceAll("_", " "),
            })}
          </Text>
          <Text selectable style={styles.instructionValue}>
            {String(v)}
          </Text>
        </View>
      ))}
      {!!reference && (
        <View style={[styles.instructionRow, styles.instructionRef]}>
          <Text style={styles.instructionLabel}>
            {t("marketplace.reference", { defaultValue: "Payment reference" })}
          </Text>
          <Text selectable style={styles.instructionMono}>
            {reference}
          </Text>
        </View>
      )}
    </View>
  )
}

export function MarketplacePayStep({
  methods,
  payTab,
  onPayTab,
  methodId,
  onMethodId,
  amountLabel,
  reference,
  onlinePayment,
  proofSubmitted,
  receiptFile,
  onReceiptFile,
  busy,
  canAct,
  onPay,
  onIvePaid,
  onWidgetCompleted,
  onWidgetFailed,
  hideOnlineCta,
  onNativePay,
  showNativePay,
  onlineCreating,
}: Props) {
  const { t } = useTranslation("app")
  const m = (key: string, fallback: string) => t(`marketplace.${key}`, { defaultValue: fallback })
  const hasOnline = methods.some((x) => x.rail === "yookassa")
  const manuals = methods.filter((x) => x.rail === "manual")
  const hasManual = manuals.length > 0
  const selectedManual = manuals.find((x) => x.id === methodId) || manuals[0]
  const picking = useRef(false)
  const showTabs = hasOnline && hasManual
  const showOnline = hasOnline && (!showTabs || payTab === "yookassa")
  const showManual = hasManual && payTab === "manual"

  async function pickReceipt() {
    if (picking.current || busy) return
    picking.current = true
    try {
      const selected = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "application/pdf"],
        copyToCacheDirectory: true,
      })
      if (selected.canceled) return
      const file = selected.assets[0]
      if ((file.size || 0) > 10 * 1024 * 1024) return
      onReceiptFile({
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
      })
    } finally {
      picking.current = false
    }
  }

  return (
    <View style={styles.wrap}>
      {showTabs ? (
        <>
          <Text style={styles.sectionTitle}>{m("payWith", "Pay with")}</Text>
          <View style={styles.tabRow}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: payTab === "yookassa" }}
              onPress={() => onPayTab("yookassa")}
              style={[styles.tab, payTab === "yookassa" && styles.tabActive]}
            >
              <CreditCard size={20} color={payTab === "yookassa" ? colors.primary : colors.muted} />
              <Text style={[styles.tabLabel, payTab === "yookassa" && styles.tabLabelActive]}>
                {m("payOnline", "Pay online")}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: payTab === "manual" }}
              onPress={() => onPayTab("manual")}
              style={[styles.tab, payTab === "manual" && styles.tabActive]}
            >
              <Landmark size={20} color={payTab === "manual" ? colors.primary : colors.muted} />
              <Text style={[styles.tabLabel, payTab === "manual" && styles.tabLabelActive]}>
                {m("payManual", "Bank transfer")}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {showOnline ? (
        <View style={styles.panel}>
          {onlinePayment?.confirmationToken ? (
            <YooKassaCheckoutWidget
              transactionId={onlinePayment.transactionId}
              confirmationToken={onlinePayment.confirmationToken}
              onCompleted={onWidgetCompleted}
              onFailed={onWidgetFailed}
            />
          ) : showNativePay && onNativePay ? (
            <PrimaryButton
              label={`${m("pay", "Pay")} · ${amountLabel}`}
              busy={busy}
              disabled={!canAct}
              onPress={onNativePay}
            />
          ) : (
            <OnlinePaySkeleton
              caption={
                canAct || onlineCreating || busy || hideOnlineCta
                  ? t("hub.pay.loading", { defaultValue: "Loading secure payment…" })
                  : m("completeDetails", "Complete the details above to continue.")
              }
            />
          )}
        </View>
      ) : null}

      {showManual ? (
        <View style={styles.panel}>
          {manuals.length > 1
            ? manuals.map((method) => {
                const selected = methodId === method.id
                return (
                  <Pressable
                    key={method.id}
                    onPress={() => onMethodId(method.id)}
                    style={[styles.methodRow, selected && styles.methodRowActive]}
                  >
                    <Landmark size={18} color={selected ? colors.primary : colors.muted} />
                    <Text style={[styles.methodName, selected && styles.methodNameActive]}>
                      {method.name}
                    </Text>
                  </Pressable>
                )
              })
            : null}

          {selectedManual ? (
            <InstructionRows instructions={selectedManual.instructions} reference={reference} />
          ) : null}

          {proofSubmitted ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                {m("proof_submitted", "Proof submitted for review")}
              </Text>
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => void pickReceipt()}
                style={[styles.upload, receiptFile ? styles.uploadDone : null]}
              >
                <View style={[styles.uploadIcon, receiptFile ? styles.uploadIconDone : null]}>
                  {receiptFile ? (
                    <Check size={20} color={colors.success} />
                  ) : (
                    <Upload size={20} color={colors.muted} />
                  )}
                </View>
                <View style={styles.uploadCopy}>
                  <Text style={styles.uploadTitle} numberOfLines={1}>
                    {receiptFile
                      ? receiptFile.name
                      : m("uploadReceipt", "Upload payment receipt")}
                  </Text>
                  <Text style={styles.uploadMeta}>
                    {receiptFile && receiptFile.size
                      ? `${(receiptFile.size / 1024 / 1024).toFixed(2)} MB`
                      : m("fileTypesHint", "JPG, PNG or PDF (max 10 MB)")}
                  </Text>
                </View>
                {receiptFile ? (
                  <Pressable hitSlop={8} onPress={() => onReceiptFile(null)}>
                    <X size={18} color={colors.muted} />
                  </Pressable>
                ) : null}
              </Pressable>
              <PrimaryButton
                label={m("ivePaid", "I've paid")}
                busy={busy}
                disabled={!canAct || !receiptFile}
                onPress={onIvePaid}
              />
            </>
          )}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  sectionTitle: {
    fontSize: typeSize.label,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  tabRow: { flexDirection: "row", gap: 10 },
  tab: {
    flex: 1,
    minHeight: space.tap + 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: "#FFF7ED",
  },
  tabLabel: {
    fontSize: typeSize.meta,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
  tabLabelActive: { color: colors.primary },
  panel: {
    ...ui.card,
    gap: 14,
    padding: 16,
  },
  hint: { fontSize: typeSize.meta, lineHeight: 18, color: colors.muted },
  methodRow: {
    minHeight: space.tap,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: radius.row,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
  methodRowActive: {
    borderColor: colors.primary,
    backgroundColor: "#FFF7ED",
  },
  methodName: { flex: 1, fontSize: typeSize.label, fontWeight: "600", color: colors.text },
  methodNameActive: { color: colors.primary },
  instructionCard: {
    gap: 14,
    padding: 14,
    borderRadius: radius.row,
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  instructionRow: { gap: 4 },
  instructionRef: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  instructionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.muted,
  },
  instructionValue: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  instructionMono: {
    fontSize: typeSize.label,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    color: colors.text,
  },
  upload: {
    minHeight: space.tap + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.row,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
  uploadDone: {
    borderStyle: "solid",
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
  },
  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.row,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.supportBg,
  },
  uploadIconDone: { backgroundColor: "#D1FAE5" },
  uploadCopy: { flex: 1, minWidth: 0 },
  uploadTitle: { fontSize: typeSize.label, fontWeight: "600", color: colors.text },
  uploadMeta: { marginTop: 2, fontSize: typeSize.meta, color: colors.muted },
  successBox: {
    borderRadius: radius.row,
    backgroundColor: "#ECFDF5",
    padding: 14,
  },
  successText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.success },
})
