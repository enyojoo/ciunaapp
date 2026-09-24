import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { Check, Plus, Search, UserPlus } from "lucide-react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { SvgXml } from "react-native-svg"
import { Avatar } from "@/components/avatar"
import { Field } from "@/components/field"
import { GroupCard } from "@/components/row"
import { PrimaryButton } from "@/components/primary-button"
import type { CurrencyRow, RecipientRow } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

export function SendRecipientStep({
  receiveCurrency,
  currencies,
  recipients,
  recipientId,
  onSelectRecipient,
  name,
  onChangeName,
  account,
  onChangeAccount,
  bank,
  onChangeBank,
  onSaveRecipient,
  saveBusy,
}: {
  receiveCurrency: string
  currencies: CurrencyRow[]
  recipients: RecipientRow[]
  recipientId: string | null
  onSelectRecipient: (id: string) => void
  name: string
  onChangeName: (v: string) => void
  account: string
  onChangeAccount: (v: string) => void
  bank: string
  onChangeBank: (v: string) => void
  onSaveRecipient: () => void
  saveBusy: boolean
}) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [showAdd, setShowAdd] = useState(false)

  const flagFor = (code?: string) => currencies.find((c) => c.code === code)?.flag_svg

  const filtered = useMemo(() => {
    const forCurrency = recipients.filter((r) => !r.currency || r.currency === receiveCurrency)
    const q = query.trim().toLowerCase()
    if (!q) return forCurrency
    return forCurrency.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        (r.account_number || "").toLowerCase().includes(q) ||
        (r.bank_name || "").toLowerCase().includes(q),
    )
  }, [recipients, receiveCurrency, query])

  return (
    <View style={styles.root}>
      <Text style={styles.headline}>{t("send.mobile.recipientHeadline", { defaultValue: "Who receives it?" })}</Text>

      <View style={styles.searchBox}>
        <Search size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("send.searchRecipients")}
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>

      <Pressable style={styles.manageLink} onPress={() => router.push("/recipients")}>
        <UserPlus size={18} color={colors.primary} strokeWidth={2.2} />
        <Text style={styles.manageLinkText}>{t("send.mobile.manageRecipients", { defaultValue: "Manage recipients" })}</Text>
      </Pressable>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {query
              ? t("send.noRecipientsSearch", { term: query })
              : t("send.noRecipientsCurrency", { currency: receiveCurrency })}
          </Text>
          <Text style={styles.emptyBody}>{t("send.addRecipientHint")}</Text>
        </View>
      ) : (
        filtered.map((r) => {
          const selected = r.id === recipientId
          return (
            <Pressable
              key={r.id}
              onPress={() => onSelectRecipient(r.id)}
              style={[styles.card, selected && styles.cardSelected]}
            >
              <View style={styles.avatarWrap}>
                <Avatar name={r.full_name} size={44} />
                {r.currency && flagFor(r.currency) ? (
                  <View style={styles.flagBadge}>
                    <SvgXml xml={flagFor(r.currency)!} width={18} height={12} />
                  </View>
                ) : null}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.name} numberOfLines={1}>
                  {r.full_name}
                </Text>
                {r.account_number ? (
                  <Text style={styles.meta} numberOfLines={1}>
                    {r.account_number}
                  </Text>
                ) : null}
                {r.bank_name ? (
                  <Text style={styles.meta} numberOfLines={1}>
                    {r.bank_name}
                  </Text>
                ) : null}
              </View>
              {selected ? (
                <View style={styles.check}>
                  <Check size={18} color="#fff" strokeWidth={2.8} />
                </View>
              ) : null}
            </Pressable>
          )
        })
      )}

      <GroupCard title={t("send.addNewRecipient")}>
        {!showAdd ? (
          <Pressable style={styles.addToggle} onPress={() => setShowAdd(true)}>
            <Plus size={18} color={colors.primary} strokeWidth={2.4} />
            <Text style={styles.addToggleText}>{t("send.addNewRecipientTitle")}</Text>
          </Pressable>
        ) : (
          <View style={styles.addForm}>
            <Field label={t("send.accountName")} value={name} onChangeText={onChangeName} />
            <Field
              label={t("recipients.fieldLabels.account_number", { defaultValue: "Account Number" })}
              value={account}
              onChangeText={onChangeAccount}
              keyboardType="number-pad"
            />
            <Field
              label={t("recipients.fieldLabels.bank_name", { defaultValue: "Bank Name" })}
              value={bank}
              onChangeText={onChangeBank}
            />
            <PrimaryButton
              label={t("send.mobile.saveRecipient", { defaultValue: "Save recipient" })}
              variant="secondary"
              onPress={onSaveRecipient}
              busy={saveBusy}
              disabled={!name.trim() || !account.trim() || !bank.trim()}
            />
          </View>
        )}
      </GroupCard>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  headline: { fontSize: 22, fontWeight: "700", color: colors.text, letterSpacing: -0.3 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: typeSize.body, color: colors.text, paddingVertical: 10 },
  manageLink: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" },
  manageLinkText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.primary },
  empty: { paddingVertical: 12, gap: 4 },
  emptyTitle: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  emptyBody: { fontSize: typeSize.meta, color: colors.muted },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: "#FFF7ED" },
  avatarWrap: { position: "relative" },
  flagBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    borderRadius: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.surface,
  },
  cardBody: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addToggle: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 48, paddingVertical: 8 },
  addToggleText: { fontSize: typeSize.body, fontWeight: "600", color: colors.primary },
  addForm: { gap: 12, paddingTop: 4 },
})
