import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { AppTextInput } from "@/components/app-text-input"
import { useInputFocusRing } from "@/lib/focused-input-box"
import { Check, ChevronRight, Plus, Search } from "lucide-react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { SvgXml } from "react-native-svg"
import { LinearGradient } from "expo-linear-gradient"
import { Avatar } from "@/components/avatar"
import { AddRecipientSheet } from "@/components/send/add-recipient-sheet"
import type { CurrencyRow, RecipientRow } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

export function SendRecipientStep({
  receiveCurrency,
  currencies,
  recipients,
  recipientId,
  onSelectRecipient,
  onRecipientCreated,
}: {
  receiveCurrency: string
  currencies: CurrencyRow[]
  recipients: RecipientRow[]
  recipientId: string | null
  onSelectRecipient: (id: string) => void
  onRecipientCreated: (recipient: RecipientRow) => void
}) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const searchFocus = useInputFocusRing()

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

      <View style={[styles.searchBox, searchFocus.boxStyle]}>
        <Search size={16} color={colors.muted} />
        <AppTextInput
          value={query}
          onChangeText={setQuery}
          onFocus={searchFocus.onFocus}
          onBlur={searchFocus.onBlur}
          placeholder={t("send.searchRecipients")}
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>

      <Pressable style={styles.addRow} onPress={() => setAddOpen(true)}>
        <LinearGradient colors={["#34D399", "#3B82F6", "#9333EA"]} style={styles.addIcon}>
          <Plus size={22} color="#fff" strokeWidth={2.5} />
        </LinearGradient>
        <Text style={styles.addRowLabel}>{t("send.addNewRecipient")}</Text>
        <ChevronRight size={20} color={colors.muted} />
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
        <View style={styles.list}>
          {filtered.map((r) => {
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
          })}
        </View>
      )}

      <Pressable style={styles.manageLink} onPress={() => router.push("/recipients")}>
        <Text style={styles.manageLinkText}>{t("send.mobile.manageRecipients", { defaultValue: "Manage all recipients" })}</Text>
      </Pressable>

      <AddRecipientSheet
        open={addOpen}
        receiveCurrency={receiveCurrency}
        currencies={currencies}
        onClose={() => setAddOpen(false)}
        onCreated={(recipient) => {
          onRecipientCreated(recipient)
          onSelectRecipient(recipient.id)
        }}
      />
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
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  addRowLabel: { flex: 1, fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  list: { gap: 10 },
  empty: { paddingVertical: 8, gap: 4 },
  emptyTitle: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  emptyBody: { fontSize: typeSize.meta, color: colors.muted },
  manageLink: { alignSelf: "center", paddingVertical: 8 },
  manageLinkText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.muted },
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
})
