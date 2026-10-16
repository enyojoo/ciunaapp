import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Send } from "lucide-react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import type { MarketplaceOrder } from "@ciuna/shared"
import { AppTextInput } from "@/components/app-text-input"
import { LoadError } from "@/components/load-error"
import { StatusBar } from "expo-status-bar"
import { ApiError, authJson } from "@/lib/social-api"
import { CHAT_MAX, type ChatMessage, type ChatThread } from "@/lib/order-chat"
import { colors, radius, type as typeSize } from "@/lib/theme"

const POLL_MS = 5000
const RATE_LIMIT_NOTICE_MS = 30_000
const CARD_PATTERN = /(?:\d[ -]?){13,19}/

type Pending = { tempId: number; body: string; status: "sending" | "failed" }
type Row = { key: string; kind: "message"; message: ChatMessage } | { key: string; kind: "pending"; pending: Pending }

const chars = (s: string) => [...s].length
const CLOSE_AFTER_DAYS = 14

/** When the chat closed: the server's date, else completion (or last event) date + 14 days. */
function closedAtFor(order: { chat?: { closesAt?: string | null }; events?: { kind: string; created_at: string }[]; updated_at?: string; created_at?: string } | null): Date | null {
  if (!order) return null
  if (order.chat?.closesAt) return new Date(order.chat.closesAt)
  const events = order.events || []
  const done = [...events].reverse().find((e) => /fulfilled|completed|cancel/i.test(e.kind))
  const base = done?.created_at || order.updated_at || events[events.length - 1]?.created_at || order.created_at
  if (!base) return null
  const d = new Date(new Date(base).getTime() + CLOSE_AFTER_DAYS * 86_400_000)
  return Number.isNaN(d.getTime()) ? null : d
}

function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export default function OrderChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const orderId = String(id || "")
  const { t, i18n } = useTranslation("app")
  const locale = i18n.resolvedLanguage || i18n.language || "en"
  const navigation = useNavigation()
  const router = useRouter()
  const scroller = useRef<ScrollView>(null)

  const [thread, setThread] = useState<ChatThread | null>(null)
  const [failed, setFailed] = useState(false)
  const [order, setOrder] = useState<
    (Pick<MarketplaceOrder, "id" | "public_id" | "snapshot"> & { created_at?: string; events?: { kind: string; created_at: string }[]; payment_state?: string; fulfillment_state?: string; updated_at?: string; seller?: { name?: string }; chat?: { closesAt?: string | null } }) | null
  >(null)
  const [pending, setPending] = useState<Pending[]>([])
  const [draft, setDraft] = useState("")
  const [rateLimited, setRateLimited] = useState(false)
  const tempId = useRef(0)
  const markedRef = useRef(0)
  const rateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sellerName = order?.seller?.name
  useEffect(() => {
    navigation.setOptions({ title: sellerName || t("chat.title", { defaultValue: "Chat with seller" }) })
  }, [navigation, t, sellerName])

  const markRead = useCallback(
    (messages: ChatMessage[]) => {
      const newest = messages.filter((m) => m.senderKind === "merchant" && !m.readAt).reduce((n, m) => Math.max(n, m.id), 0)
      if (!newest || newest <= markedRef.current) return
      markedRef.current = newest
      void authJson(`/api/hub/orders/${encodeURIComponent(orderId)}/messages/read`, { method: "POST", body: {} }).catch(() => {
        markedRef.current = 0
      })
    },
    [orderId],
  )

  const load = useCallback(async () => {
    try {
      const next = await authJson<ChatThread>(`/api/hub/orders/${encodeURIComponent(orderId)}/messages`)
      setThread(next)
      setFailed(false)
      markRead(next.messages)
    } catch {
      // A failed background poll keeps what is on screen; only a first load shows the error.
      setThread((cur) => {
        if (!cur) setFailed(true)
        return cur
      })
    }
  }, [orderId, markRead])

  useEffect(() => {
    void authJson<{ order: MarketplaceOrder }>(`/api/hub/orders/${encodeURIComponent(orderId)}`)
      .then((r) => setOrder(r.order))
      .catch(() => undefined)
  }, [orderId])

  // Poll while the screen is focused and the app is in the foreground.
  useFocusEffect(
    useCallback(() => {
      void load()
      const timer = setInterval(() => {
        if (AppState.currentState === "active") void load()
      }, POLL_MS)
      const sub = AppState.addEventListener("change", (s) => {
        if (s === "active") void load()
      })
      return () => {
        clearInterval(timer)
        sub.remove()
      }
    }, [load]),
  )

  useEffect(
    () => () => {
      if (rateTimer.current) clearTimeout(rateTimer.current)
    },
    [],
  )

  const rows: Row[] = useMemo(() => {
    const server: Row[] = (thread?.messages || []).map((m) => ({ key: `m${m.id}`, kind: "message", message: m }))
    const local: Row[] = pending.map((p) => ({ key: `p${p.tempId}`, kind: "pending", pending: p }))
    return [...server, ...local]
  }, [thread, pending])

  useEffect(() => {
    const timer = setTimeout(() => scroller.current?.scrollToEnd({ animated: false }), 30)
    return () => clearTimeout(timer)
  }, [rows.length])

  const lastSeenId = useMemo(() => {
    const mine = (thread?.messages || []).filter((m) => m.senderKind === "customer")
    const last = mine[mine.length - 1]
    return last && last.readAt ? last.id : null
  }, [thread])

  const send = useCallback(
    async (body: string, existing?: number) => {
      const temp = existing ?? ++tempId.current
      setPending((cur) =>
        existing
          ? cur.map((p) => (p.tempId === existing ? { ...p, status: "sending" } : p))
          : [...cur, { tempId: temp, body, status: "sending" }],
      )
      if (!existing) setDraft("")
      try {
        const res = await authJson<{ message: ChatMessage }>(`/api/hub/orders/${encodeURIComponent(orderId)}/messages`, {
          method: "POST",
          body: { body, language: locale.slice(0, 12) },
        })
        setThread((cur) =>
          cur && !cur.messages.some((m) => m.id === res.message.id)
            ? { ...cur, messages: [...cur.messages, res.message] }
            : cur,
        )
        setPending((cur) => cur.filter((p) => p.tempId !== temp))
        setRateLimited(false)
      } catch (e) {
        const status = e instanceof ApiError ? e.status : 0
        const code = e instanceof ApiError ? e.code : ""
        if (status === 429 || code === "RATE_LIMITED") {
          setPending((cur) => cur.filter((p) => p.tempId !== temp))
          setDraft((cur) => (cur.trim() ? cur : body))
          setRateLimited(true)
          if (rateTimer.current) clearTimeout(rateTimer.current)
          rateTimer.current = setTimeout(() => setRateLimited(false), RATE_LIMIT_NOTICE_MS)
        } else if (code === "CHAT_CLOSED" || code === "CHAT_UNAVAILABLE") {
          setPending((cur) => cur.filter((p) => p.tempId !== temp))
          setDraft((cur) => (cur.trim() ? cur : body))
          void load()
        } else {
          setPending((cur) => cur.map((p) => (p.tempId === temp ? { ...p, status: "failed" } : p)))
        }
      }
    },
    [orderId, locale, load],
  )

  const count = chars(draft)
  const over = count > CHAT_MAX
  const canSend = Boolean(draft.trim()) && !over && !rateLimited
  const open = Boolean(thread && thread.available && !thread.closed)
  const closedAt = closedAtFor(order)
  const showCardHint = CARD_PATTERN.test(draft)

  const submit = () => {
    if (canSend) void send(draft.trim())
  }

  const time = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })
    } catch {
      return ""
    }
  }
  const dayLabel = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    if (dayKey(iso) === dayKey(now.toISOString())) return t("chat.today", { defaultValue: "Today" })
    const y = new Date(now)
    y.setDate(now.getDate() - 1)
    if (dayKey(iso) === dayKey(y.toISOString())) return t("chat.yesterday", { defaultValue: "Yesterday" })
    try {
      return d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" })
    } catch {
      return ""
    }
  }

  const body = (() => {
    if (!thread && failed) return <LoadError onRetry={() => void load()} />
    if (!thread) {
      return (
        <View style={styles.skeletons} accessibilityLabel={t("chat.loading", { defaultValue: "Loading messages" })}>
          <View style={[styles.skel, styles.skelIn]} />
          <View style={[styles.skel, styles.skelOut]} />
          <View style={[styles.skel, styles.skelIn, { width: "40%" }]} />
          <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
        </View>
      )
    }
    if (thread.unavailable) {
      return (
        <View style={styles.center}>
          <Text style={styles.centerTitle}>{t("chat.unavailable", { defaultValue: "Messaging isn't available right now" })}</Text>
          <Text style={styles.centerBody}>{t("chat.unavailableBody", { defaultValue: "Please try again later." })}</Text>
        </View>
      )
    }
    if (!thread.available) {
      return (
        <View style={styles.center}>
          <Text style={styles.centerTitle}>{t("chat.notAvailableTitle", { defaultValue: "Chat opens once your order is paid" })}</Text>
          <Text style={styles.centerBody}>
            {t("chat.notAvailableBody", { defaultValue: "You can message the seller as soon as your payment is confirmed." })}
          </Text>
          {order ? (
            <Pressable
              onPress={() => router.push(`/orders/${order.id}` as never)}
              accessibilityRole="button"
              style={styles.payBtn}
            >
              <Text style={styles.payBtnText}>{t("hub.checkout.paidOnline", { defaultValue: "Complete payment" })}</Text>
            </Pressable>
          ) : null}
        </View>
      )
    }
    if (rows.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.centerTitle}>{t("chat.empty", { defaultValue: "Ask the seller a question about your order." })}</Text>
        </View>
      )
    }
    let prevDay = ""
    return (
      <>
        {rows.map((row) => {
          if (row.kind === "pending") {
            const p = row.pending
            return (
              <View key={row.key} style={[styles.rowOut, p.status === "sending" && styles.dim]}>
                <View style={[styles.bubble, styles.bubbleOut]}>
                  <Text style={styles.textOut}>{p.body}</Text>
                </View>
                {p.status === "failed" ? (
                  <View style={styles.failRow}>
                    <Text style={styles.failText}>{t("chat.notSent", { defaultValue: "Not sent" })}</Text>
                    <Pressable
                      onPress={() => void send(p.body, p.tempId)}
                      accessibilityRole="button"
                      hitSlop={8}
                      style={styles.retryHit}
                    >
                      <Text style={styles.retryText}>{t("chat.retry", { defaultValue: "Retry" })}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            )
          }
          const m = row.message
          const dk = dayKey(m.createdAt)
          const sep = dk !== prevDay
          prevDay = dk
          const mine = m.senderKind === "customer"
          return (
            <View key={row.key}>
              {sep ? (
                <View style={styles.sep}>
                  <Text style={styles.sepText}>{dayLabel(m.createdAt)}</Text>
                </View>
              ) : null}
              <View style={mine ? styles.rowOut : styles.rowIn}>
                <View style={[styles.bubble, mine ? styles.bubbleOut : styles.bubbleIn]}>
                  <Text style={mine ? styles.textOut : styles.textIn} selectable>
                    {m.body}
                  </Text>
                </View>
                <Text style={styles.time}>
                  {time(m.createdAt)}
                  {mine && lastSeenId === m.id && m.readAt
                    ? ` · ${t("chat.seen", { time: time(m.readAt), defaultValue: "Seen {{time}}" })}`
                    : ""}
                </Text>
              </View>
            </View>
          )
        })}
      </>
    )
  })()

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      <StatusBar style="dark" />
      {order ? (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace(`/orders/${order.id}` as never))}
          accessibilityRole="button"
          style={styles.strip}
        >
          <Text style={styles.stripId}>{t("chat.orderStrip", { id: order.public_id, defaultValue: "Order {{id}}" })}</Text>
          <Text style={styles.stripTitle} numberOfLines={1}>
            {order.snapshot?.title}
          </Text>
        </Pressable>
      ) : null}
      <ScrollView
        ref={scroller}
        style={styles.flex}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {body}
      </ScrollView>

      {thread?.available && thread.closed ? (
        <View style={styles.banner} accessibilityRole="alert">
          <Text style={styles.bannerText}>
            {closedAt
              ? t("chat.closedOn", {
                  date: closedAt.toLocaleDateString(locale, { dateStyle: "medium" }),
                  defaultValue: "Chat closed on {{date}}. You can still read the conversation.",
                })
              : t("chat.closed", { defaultValue: "This chat is closed. You can still read the conversation." })}
          </Text>
        </View>
      ) : null}
      {rateLimited && open ? (
        <View style={[styles.banner, styles.bannerWarn]} accessibilityRole="alert">
          <Text style={[styles.bannerText, styles.bannerWarnText]}>
            {t("chat.rateLimited", { defaultValue: "You are sending messages too fast. Wait a moment, your message is kept." })}
          </Text>
        </View>
      ) : null}

      {thread && thread.available && !thread.closed ? (
        <SafeAreaView edges={["bottom"]} style={styles.composerWrap}>
          {showCardHint ? (
            <Text style={styles.hint}>
              {t("chat.cardHint", { defaultValue: "Please don't share card numbers or payment details here." })}
            </Text>
          ) : null}
          <View style={styles.composer}>
            <AppTextInput
              value={draft}
              onChangeText={setDraft}
              multiline
              placeholder={t("chat.placeholder", { defaultValue: "Write a message" })}
              placeholderTextColor="#9CA3AF"
              accessibilityLabel={t("chat.placeholder", { defaultValue: "Write a message" })}
              style={[styles.input, over && styles.inputOver]}
              onKeyPress={(e) => {
                const ev = e.nativeEvent as unknown as { key?: string; shiftKey?: boolean }
                if (Platform.OS === "web" && ev.key === "Enter" && !ev.shiftKey) {
                  ;(e as unknown as { preventDefault?: () => void }).preventDefault?.()
                  submit()
                }
              }}
            />
            <Pressable
              onPress={submit}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel={t("chat.send", { defaultValue: "Send" })}
              style={[styles.sendBtn, !canSend && styles.sendOff]}
            >
              <Send size={20} color={colors.onPrimary} strokeWidth={2.2} />
            </Pressable>
          </View>
          <Text style={[styles.counter, over && styles.counterOver]}>
            {t("chat.counter", { n: count, max: CHAT_MAX, defaultValue: "{{n}} / {{max}}" })}
          </Text>
        </SafeAreaView>
      ) : null}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  strip: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stripId: { fontSize: 12, fontWeight: "700", color: colors.muted },
  stripTitle: { marginTop: 2, fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  list: { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  skeletons: { gap: 10, paddingTop: 8 },
  skel: { height: 40, width: "62%", borderRadius: 16, backgroundColor: "#E5E7EB" },
  skelIn: { alignSelf: "flex-start" },
  skelOut: { alignSelf: "flex-end", width: "48%" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64, paddingHorizontal: 24 },
  centerTitle: { textAlign: "center", fontSize: 17, fontWeight: "600", color: colors.text },
  payBtn: { marginTop: 20, minHeight: 48, paddingHorizontal: 24, borderRadius: radius.row, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  payBtnText: { fontSize: typeSize.body, fontWeight: "700", color: colors.onPrimary },
  centerBody: { marginTop: 8, textAlign: "center", fontSize: typeSize.body, color: colors.muted },
  sep: { alignItems: "center", marginVertical: 10 },
  sepText: { fontSize: 12, fontWeight: "600", color: colors.muted },
  rowIn: { alignItems: "flex-start", marginBottom: 6 },
  rowOut: { alignItems: "flex-end", marginBottom: 6 },
  dim: { opacity: 0.6 },
  bubble: { maxWidth: "82%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleIn: { backgroundColor: "#E5E7EB", borderBottomLeftRadius: 6 },
  bubbleOut: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  textIn: { fontSize: typeSize.body, lineHeight: 21, color: colors.text },
  textOut: { fontSize: typeSize.body, lineHeight: 21, color: colors.onPrimary },
  time: { marginTop: 3, marginHorizontal: 4, fontSize: 11, color: colors.muted },
  failRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 3 },
  failText: { fontSize: 12, fontWeight: "700", color: colors.danger },
  retryHit: { minHeight: 32, justifyContent: "center" },
  retryText: { fontSize: 12, fontWeight: "700", color: colors.primaryText },
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: radius.row,
    backgroundColor: colors.neutralSurface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerText: { fontSize: typeSize.meta, color: colors.neutralText },
  bannerWarn: { backgroundColor: colors.warningSurface },
  bannerWarnText: { color: colors.warningText, fontWeight: "600" },
  composerWrap: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, paddingTop: 8 },
  hint: { marginBottom: 6, fontSize: 12, color: colors.warningText },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: typeSize.body,
    color: colors.text,
  },
  inputOver: { borderColor: colors.danger },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  sendOff: { opacity: 0.4 },
  counter: { marginTop: 4, marginBottom: 6, textAlign: "right", fontSize: 12, color: colors.muted },
  counterOver: { color: colors.danger, fontWeight: "700" },
})
