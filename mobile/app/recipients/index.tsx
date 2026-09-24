import { useMemo, useState } from "react"
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native"
import { AppTextInput } from "@/components/app-text-input"
import { useInputFocusRing } from "@/lib/focused-input-box"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { SvgXml } from "react-native-svg"
import { Pencil, Plus, Search, Trash2 } from "lucide-react-native"
import { Avatar } from "@/components/avatar"
import { EmptyState } from "@/components/empty-state"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useFocusRevalidate } from "@/lib/use-focus-revalidate"
import { useFx } from "@/lib/use-fx"
import { useRecipients } from "@/lib/use-recipients"
import { colors, radius, type as typeSize } from "@/lib/theme"

export default function RecipientsScreen() {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { user } = useAuth()
  const { showError } = useToast()
  const { currencies } = useFx()
  const { data, loading, revalidate, mutate } = useRecipients(user?.id)
  const rows = data || []
  const [query, setQuery] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const searchFocus = useInputFocusRing()

  useFocusRevalidate(revalidate)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) => r.full_name.toLowerCase().includes(q) || (r.account_number || "").toLowerCase().includes(q),
    )
  }, [rows, query])

  const flagFor = (code?: string) => currencies.find((c) => c.code === code)?.flag_svg

  const remove = (id: string) => {
    Alert.alert(
      t("recipients.confirmDeleteTitle", { defaultValue: "Delete recipient?" }),
      t("recipients.confirmDeleteBody", { defaultValue: "This can't be undone." }),
      [
        { text: t("referrals.cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("recipients.deleteAction", { defaultValue: "Delete" }),
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeletingId(id)
              const { error } = await supabase.from("recipients").delete().eq("id", id)
              setDeletingId(null)
              if (error) {
                showError(t("recipients.failedDeleteLinked"))
                return
              }
              mutate((prev) => (prev || []).filter((r) => r.id !== id))
            })()
          },
        },
      ],
    )
  }

  return (
    <ScreenScroll edges={["left", "right"]}>
      <Pressable style={styles.addBtn} onPress={() => router.push("/recipients/form")}>
        <Plus size={18} color="#fff" strokeWidth={2.4} />
        <Text style={styles.addBtnText}>{t("recipients.addRecipient")}</Text>
      </Pressable>

      <View style={[styles.searchBox, searchFocus.boxStyle]}>
        <Search size={16} color={colors.muted} />
        <AppTextInput
          value={query}
          onChangeText={setQuery}
          onFocus={searchFocus.onFocus}
          onBlur={searchFocus.onBlur}
          placeholder={t("recipients.searchPlaceholder")}
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? t("recipients.noMatchSearch") : t("recipients.noneFound")}
          body={query ? undefined : t("recipients.emptyAddHint")}
        />
      ) : (
        filtered.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.avatarWrap}>
              <Avatar name={r.full_name} size={48} />
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
              ) : r.iban ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {r.iban}
                </Text>
              ) : null}
              <Text style={styles.meta} numberOfLines={1}>
                {r.bank_name}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <Pressable
                onPress={() => router.push(`/recipients/form?id=${r.id}`)}
                style={styles.iconBtn}
                hitSlop={8}
              >
                <Pencil size={16} color={colors.text} strokeWidth={2} />
              </Pressable>
              <Pressable
                onPress={() => remove(r.id)}
                style={styles.iconBtn}
                hitSlop={8}
                disabled={deletingId === r.id}
              >
                <Trash2 size={16} color={colors.danger} strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 60, alignItems: "center" },
  addBtn: {
    marginBottom: 16,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.row,
    backgroundColor: colors.primary,
  },
  addBtnText: { fontSize: typeSize.body, fontWeight: "600", color: "#fff" },
  searchBox: {
    marginBottom: 16,
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
  card: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
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
  cardActions: { flexDirection: "row", gap: 4 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
})
