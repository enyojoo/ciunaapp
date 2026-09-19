import { useMemo, useState } from "react"
import * as Clipboard from "expo-clipboard"
import { ActivityIndicator, Modal, Pressable, Share, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Trans, useTranslation } from "react-i18next"
import QRCode from "react-native-qrcode-svg"
import { Check, Copy, Share2, Users, Wallet } from "lucide-react-native"
import { Field } from "@/components/field"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { SheetPicker } from "@/components/sheet-picker"
import { useToast } from "@/components/toast-provider"
import { fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useCachedQuery } from "@/lib/use-cached-query"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useFx } from "@/lib/use-fx"
import { useRecipients } from "@/lib/use-recipients"
import { colors, radius, type as typeSize } from "@/lib/theme"

interface ReferralRow {
  id: string
  name: string
  transactionCount: number
  earningsDisplay: string
  percentWindowEndsAt?: string
}

interface TierCommissionPayload {
  qualifiedRefereesThisQuarter: number
  currentTierIndex: number
  tiers: { configuredQualifiedRefereesInQuarter: number; percentDisplay: string }[]
}

interface ProgramSettings {
  program_active: boolean
  mode: "percent" | "tier" | "threshold"
  percent_of_send: number
  percent_reward_duration_months: number
  policy_currency: string
  reward_amount: number
  threshold_send_amount: number
}

interface MeResponse {
  slug: string
  shareUrl: string
  program?: ProgramSettings
  tierCommission?: TierCommissionPayload
  balances: {
    availableDisplay: string
    lifetimeDisplay: string
    availableAmountBase?: number
  }
  referrals: ReferralRow[]
}

const REFERRALS_TTL_MS = 2 * 60_000

async function fetchReferralsMe(): Promise<MeResponse> {
  const res = await fetchWithAuth("/api/referrals/me")
  if (!res.ok) throw new Error("Failed to load referrals")
  return (await res.json()) as MeResponse
}

export default function ReferralsScreen() {
  const { t } = useTranslation("app")
  const { user } = useAuth()
  const { showError, showSuccess } = useToast()
  const { currencies } = useFx()

  const meKey = user ? `ciuna_referrals_me_${user.id}` : null
  const { data, loading, revalidate } = useCachedQuery<MeResponse>(meKey, fetchReferralsMe, {
    ttlMs: REFERRALS_TTL_MS,
  })
  useFocusRevalidate(revalidate)

  const [copied, setCopied] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const { data: recipientsData, revalidate: revalidateRecipients } = useRecipients(user?.id)
  const recipients = recipientsData || []
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false)
  const [recipientId, setRecipientId] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const openWithdraw = () => {
    setWithdrawOpen(true)
    revalidateRecipients()
  }

  const copyLink = async () => {
    if (!data?.shareUrl) return
    await Clipboard.setStringAsync(data.shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = async () => {
    if (!data?.shareUrl) return
    await Share.share({ message: `${t("referrals.shareMessagePrefix")} ${data.shareUrl}` })
  }

  const programSummary = useMemo(() => {
    const program = data?.program
    if (!program) return ""
    if (!program.program_active) return t("referrals.programPaused")
    if (program.mode === "percent") {
      return t("referrals.programPercent", {
        pct: (program.percent_of_send * 100).toFixed(2),
        months: program.percent_reward_duration_months,
      })
    }
    if (program.mode === "tier") {
      return t("referrals.programTier", { months: program.percent_reward_duration_months })
    }
    return t("referrals.programThreshold", {
      reward: `${program.reward_amount} ${program.policy_currency}`,
      threshold: `${program.threshold_send_amount} ${program.policy_currency}`,
    })
  }, [data?.program, t])

  const baseCurrencySymbol = useMemo(() => {
    const currency = currencies.find((c) => c.code === recipients.find((r) => r.id === recipientId)?.currency)
    return currency?.symbol || ""
  }, [currencies, recipients, recipientId])

  const submitWithdraw = async () => {
    if (!recipientId || !amount) {
      showError(t("referrals.errRecipientAmount"))
      return
    }
    const amt = Number.parseFloat(amount)
    if (!(amt > 0)) {
      showError(t("referrals.errAmountPositive"))
      return
    }
    const max = data?.balances.availableAmountBase
    if (max !== undefined && amt > max + 1e-6) {
      showError(t("referrals.errAmountExceeds", { balance: data?.balances.availableDisplay ?? "" }))
      return
    }
    setSubmitting(true)
    const res = await fetchWithAuth("/api/referrals/payout-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, amount: amt }),
    })
    const body = await res.json().catch(() => ({}))
    setSubmitting(false)
    if (!res.ok) {
      showError((body as { error?: string }).error || t("referrals.requestFailed"))
      return
    }
    setWithdrawOpen(false)
    setAmount("")
    setRecipientId(null)
    showSuccess(t("referrals.submitRequest"))
    revalidate()
  }

  if (loading) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll edges={["left", "right"]}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{t("referrals.referFriend")}</Text>
        {programSummary ? <Text style={styles.heroSummary}>{programSummary}</Text> : null}

        {data?.shareUrl ? (
          <View style={styles.qrWrap}>
            <QRCode value={data.shareUrl} size={140} color={colors.text} backgroundColor="#ffffff" />
          </View>
        ) : null}

        <View style={styles.linkRow}>
          <Text style={styles.linkText} numberOfLines={1}>
            {data?.shareUrl}
          </Text>
          <Pressable onPress={() => void copyLink()} hitSlop={8} style={styles.copyBtn}>
            {copied ? (
              <Check size={16} color={colors.success} strokeWidth={2.4} />
            ) : (
              <Copy size={16} color={colors.text} strokeWidth={2} />
            )}
          </Pressable>
        </View>

        {data?.tierCommission && data.tierCommission.tiers.length > 0 ? (
          <View style={styles.tierBlock}>
            <Text style={styles.tierHeading}>{t("referrals.commissionRules")}</Text>
            <Text style={styles.tierHint}>{t("referrals.commissionRulesHint")}</Text>
            <View style={styles.tierList}>
              {data.tierCommission.tiers.map((tier, i) => {
                const active = i === data.tierCommission!.currentTierIndex
                return (
                  <View key={i} style={[styles.tierRow, active && styles.tierRowActive]}>
                    <Text style={[styles.tierRowText, active && styles.tierRowTextActive]}>
                      <Trans
                        ns="app"
                        i18nKey="referrals.tierLine"
                        count={tier.configuredQualifiedRefereesInQuarter}
                        values={{ count: tier.configuredQualifiedRefereesInQuarter }}
                        components={{ bold: <Text style={styles.bold} /> }}
                      />
                    </Text>
                    <Text style={[styles.tierRowPct, active && styles.tierRowTextActive]}>{tier.percentDisplay}</Text>
                  </View>
                )
              })}
            </View>
            <Text style={styles.tierExample}>{t("referrals.commissionRulesExample")}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceIcon}>
          <Wallet size={22} color={colors.primary} strokeWidth={2} />
        </View>
        <View style={styles.balanceBody}>
          <Text style={styles.balanceLabel}>{t("referrals.availableWithdraw")}</Text>
          <Text style={styles.balanceValue}>{data?.balances.availableDisplay ?? "—"}</Text>
          <Text style={styles.balanceLifetime}>
            {t("referrals.lifetimeEarned", { amount: data?.balances.lifetimeDisplay ?? "—" })}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t("referrals.myReferrals")}</Text>
      <View style={styles.listCard}>
        {!data?.referrals?.length ? (
          <View style={styles.empty}>
            <Users size={32} color={colors.muted} strokeWidth={1.5} />
            <Text style={styles.emptyText}>{t("referrals.noReferrals")}</Text>
          </View>
        ) : (
          data.referrals.map((r, i) => (
            <View key={r.id} style={[styles.refRow, i < data.referrals.length - 1 && styles.refRowBorder]}>
              <View style={styles.refBody}>
                <Text style={styles.refName}>{(r.name || "").trim() || t("referrals.unnamedReferee")}</Text>
                <Text style={styles.refMeta}>{t("referrals.completedTxCount", { count: r.transactionCount || 0 })}</Text>
              </View>
              <Text style={styles.refEarnings}>{r.earningsDisplay}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.actions}>
        <View style={styles.actionHalf}>
          <PrimaryButton label={t("referrals.shareLink")} onPress={() => void shareLink()} />
        </View>
        <View style={styles.actionHalf}>
          <PrimaryButton label={t("referrals.withdraw")} variant="secondary" onPress={openWithdraw} />
        </View>
      </View>

      <SheetPicker
        open={withdrawOpen && recipientPickerOpen}
        title={t("referrals.selectRecipient")}
        items={recipients}
        keyExtractor={(r) => r.id}
        labelExtractor={(r) => `${r.full_name} — ${r.bank_name || ""}`}
        selectedId={recipientId}
        onSelect={(r) => setRecipientId(r.id)}
        onClose={() => setRecipientPickerOpen(false)}
      />

      <Modal visible={withdrawOpen} animationType="slide" transparent onRequestClose={() => setWithdrawOpen(false)}>
        <View style={styles.withdrawOverlay}>
          <SafeAreaView edges={["bottom"]} style={styles.withdrawSheet}>
            <Text style={styles.withdrawTitle}>{t("referrals.requestPayout")}</Text>
            <Text style={styles.withdrawInstructions}>
              {t("referrals.payoutInstructions", { available: data?.balances.availableDisplay ?? "" })}
            </Text>
            <Text style={styles.label}>{t("referrals.recipient")}</Text>
            <Pressable style={styles.selectBox} onPress={() => setRecipientPickerOpen(true)}>
              <Text style={styles.selectText}>
                {recipients.find((r) => r.id === recipientId)?.full_name || t("referrals.selectRecipient")}
              </Text>
            </Pressable>
            <Field
              label={t("referrals.amount", { symbol: baseCurrencySymbol })}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            <View style={styles.actions}>
              <View style={styles.actionHalf}>
                <PrimaryButton
                  label={t("referrals.cancel")}
                  variant="secondary"
                  onPress={() => setWithdrawOpen(false)}
                  disabled={submitting}
                />
              </View>
              <View style={styles.actionHalf}>
                <PrimaryButton label={t("referrals.submitRequest")} busy={submitting} onPress={() => void submitWithdraw()} />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 80, alignItems: "center" },
  heroCard: {
    marginBottom: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.referBorder,
    backgroundColor: colors.referBg,
    padding: 18,
  },
  heroTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  heroSummary: { marginTop: 6, fontSize: typeSize.meta, lineHeight: 19, color: colors.muted },
  qrWrap: { alignItems: "center", marginVertical: 18 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.row,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linkText: { flex: 1, fontSize: 13, color: colors.text },
  copyBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  tierBlock: { marginTop: 18 },
  tierHeading: { fontSize: 15, fontWeight: "600", color: colors.text },
  tierHint: { marginTop: 2, fontSize: 12, color: colors.muted },
  tierList: {
    marginTop: 10,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.85)",
    overflow: "hidden",
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tierRowActive: { backgroundColor: colors.heroBody },
  tierRowText: { flex: 1, fontSize: 13, color: colors.text },
  tierRowTextActive: { color: colors.primaryDeep, fontWeight: "600" },
  tierRowPct: { fontSize: 13, fontWeight: "700", color: colors.text },
  bold: { fontWeight: "700" },
  tierExample: { marginTop: 8, fontSize: 11, color: colors.muted },
  balanceCard: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroBody,
  },
  balanceBody: { flex: 1 },
  balanceLabel: { fontSize: 12, color: colors.muted },
  balanceValue: { fontSize: 22, fontWeight: "700", color: colors.primary },
  balanceLifetime: { marginTop: 2, fontSize: 12, color: colors.muted },
  sectionLabel: { marginBottom: 8, fontSize: 12, fontWeight: "600", color: colors.muted, textTransform: "uppercase" },
  listCard: {
    marginBottom: 24,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  empty: { alignItems: "center", gap: 8, paddingVertical: 40 },
  emptyText: { fontSize: typeSize.meta, color: colors.muted },
  refRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 },
  refRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  refBody: { flex: 1 },
  refName: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  refMeta: { marginTop: 2, fontSize: 12, color: colors.muted },
  refEarnings: { fontSize: typeSize.body, fontWeight: "700", color: colors.primary },
  actions: { flexDirection: "row", gap: 12 },
  actionHalf: { flex: 1 },
  withdrawOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  withdrawSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.paper,
    padding: 20,
    paddingBottom: 32,
  },
  withdrawTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8 },
  withdrawInstructions: { fontSize: typeSize.meta, color: colors.muted, marginBottom: 16 },
  label: { marginBottom: 8, fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  selectBox: {
    minHeight: 48,
    justifyContent: "center",
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  selectText: { fontSize: typeSize.body, color: colors.text },
})
