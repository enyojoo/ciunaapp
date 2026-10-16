import { Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { ChevronRight, MessageCircle } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { PrimaryButton } from "@/components/primary-button"
import { useChatUnread } from "@/lib/order-chat"
import { colors, radius, type as typeSize } from "@/lib/theme"

/** "Message seller" row on the order screen. A dot shows when the seller has written and it has not been read. */
export function SellerChatCard({ orderId, sellerName, photoUrl }: { orderId: string; sellerName?: string | null; photoUrl?: string | null }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { unread, unavailable } = useChatUnread(orderId)
  if (unavailable) return null
  const label = t("chat.messageSeller", { defaultValue: "Message seller" })
  return (
    <Pressable
      onPress={() => router.push(`/orders/${orderId}/chat` as never)}
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `${label}. ${t("chat.unreadAria", { defaultValue: "New messages" })}` : label}
      style={styles.card}
    >
      <View style={styles.icon}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} contentFit="cover" />
        ) : (
          <MessageCircle size={20} color={colors.primaryText} strokeWidth={2.2} />
        )}
        {unread > 0 ? <View style={styles.dot} /> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.hint} numberOfLines={1}>
          {unread > 0
            ? t("chat.unreadAria", { defaultValue: "New messages" })
            : sellerName || t("chat.messageSellerHint", { defaultValue: "Ask about your order" })}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
    </Pressable>
  )
}

/** Bottom bar with the same Message seller action, shown while an order is live. */
export function StickyMessageSeller({ orderId }: { orderId: string }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { unread, unavailable } = useChatUnread(orderId)
  if (unavailable) return null
  return (
    <View style={styles.sticky}>
      <PrimaryButton
        label={(unread > 0 ? "● " : "") + t("chat.messageSeller", { defaultValue: "Message seller" })}
        onPress={() => router.push(`/orders/${orderId}/chat` as never)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  sticky: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryTint },
  photo: { width: 40, height: 40, borderRadius: 20 },
  dot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
  hint: { marginTop: 2, fontSize: typeSize.meta, color: colors.muted },
})
