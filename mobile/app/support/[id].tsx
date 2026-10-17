import { useCallback, useEffect, useRef, useState } from "react"
import { AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useFocusEffect, useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { Send } from "lucide-react-native"
import { AppTextInput } from "@/components/app-text-input"
import { LoadError } from "@/components/load-error"
import { SupportStatusBadge, supportErrorText, type SupportStatus } from "@/components/support-status"
import { ApiError, authJson } from "@/lib/social-api"
import { colors, radius, type as typeSize } from "@/lib/theme"

type Message = { id: number; sender_kind: "customer" | "agent" | "system"; body: string; created_at: string }
type Thread = {
  request: { id: string; public_id: string; subject: string; status: SupportStatus; customer_unread: number }
  messages: Message[]
}

const MAX = 4000
const POLL_MS = 8000

export default function SupportThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const requestId = String(id || "")
  const { t, i18n } = useTranslation("app")
  const [thread, setThread] = useState<Thread | null>(null)
  const [failed, setFailed] = useState(false)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scroller = useRef<ScrollView>(null)
  const readFor = useRef(0)

  const load = useCallback(async () => {
    try {
      const next = await authJson<Thread>(`/api/support/requests/${encodeURIComponent(requestId)}`)
      setThread(next)
      setFailed(false)
      // Opening the thread clears the unread dot, once per new reply.
      if (next.request.customer_unread > 0 && readFor.current !== next.messages.length) {
        readFor.current = next.messages.length
        void authJson(`/api/support/requests/${encodeURIComponent(requestId)}/read`, { method: "POST", body: {} }).catch(() => undefined)
      }
    } catch {
      setThread((cur) => {
        if (!cur) setFailed(true)
        return cur
      })
    }
  }, [requestId])

  useFocusEffect(
    useCallback(() => {
      void load()
      const timer = setInterval(() => {
        if (AppState.currentState === "active") void load()
      }, POLL_MS)
      return () => clearInterval(timer)
    }, [load]),
  )

  useEffect(() => {
    scroller.current?.scrollToEnd({ animated: false })
  }, [thread?.messages.length])

  const send = async () => {
    const text = draft.trim()
    if (!text || busy) return
    setBusy(true)
    setError(null)
    try {
      await authJson(`/api/support/requests/${encodeURIComponent(requestId)}/messages`, { method: "POST", body: { body: text } })
      setDraft("")
      await load()
    } catch (e) {
      setError(supportErrorText(t, e instanceof ApiError ? e.code : undefined)) // the draft stays
    } finally {
      setBusy(false)
    }
  }

  if (!thread) return failed ? <LoadError onRetry={() => void load()} /> : <View style={styles.flex} />

  const time = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" })
    } catch {
      return ""
    }
  }
  const over = [...draft].length > MAX

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      <View style={styles.head}>
        <Text style={styles.subject} numberOfLines={2}>
          {thread.request.subject}
        </Text>
        <View style={styles.headMeta}>
          <SupportStatusBadge status={thread.request.status} />
          <Text style={styles.ref}>{thread.request.public_id}</Text>
        </View>
      </View>
      <ScrollView ref={scroller} style={styles.flex} contentContainerStyle={styles.list}>
        {thread.messages.map((m) =>
          m.sender_kind === "system" ? (
            <Text key={m.id} style={styles.system}>
              {m.body === "resolved" ? t("support.req.resolvedLine", { defaultValue: "Marked as resolved" }) : m.body}
            </Text>
          ) : (
            <View key={m.id} style={[styles.bubbleWrap, m.sender_kind === "customer" ? styles.mine : styles.theirs]}>
              {m.sender_kind === "agent" ? <Text style={styles.agent}>{t("support.req.agent", { defaultValue: "Ciuna support" })}</Text> : null}
              <View style={[styles.bubble, m.sender_kind === "customer" ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, m.sender_kind === "customer" && styles.bubbleTextMine]}>{m.body}</Text>
              </View>
              <Text style={styles.time}>{time(m.created_at)}</Text>
            </View>
          ),
        )}
      </ScrollView>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <View style={styles.composer}>
        <AppTextInput
          value={draft}
          onChangeText={(v) => {
            setDraft(v)
            setError(null)
          }}
          multiline
          placeholder={t("support.req.reply", { defaultValue: "Write a reply" })}
          placeholderTextColor={colors.subtle}
          style={[styles.input, over && styles.inputOver]}
        />
        <Pressable
          onPress={() => void send()}
          disabled={!draft.trim() || over || busy}
          accessibilityRole="button"
          accessibilityLabel={t("chat.send", { defaultValue: "Send" })}
          style={[styles.sendBtn, (!draft.trim() || over || busy) && styles.sendOff]}
        >
          <Send size={20} color={colors.onPrimary} strokeWidth={2.2} />
        </Pressable>
      </View>
      <Text style={[styles.counter, over && styles.counterOver]}>{`${[...draft].length} / ${MAX}`}</Text>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  head: { paddingHorizontal: 16, paddingBottom: 10, gap: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  subject: { fontSize: 18, fontWeight: "700", color: colors.text },
  headMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  ref: { fontSize: 12, color: colors.muted },
  list: { padding: 16, gap: 12 },
  system: { textAlign: "center", fontSize: 12, fontWeight: "600", color: colors.muted },
  bubbleWrap: { maxWidth: "82%", gap: 2 },
  mine: { alignSelf: "flex-end", alignItems: "flex-end" },
  theirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  agent: { fontSize: 12, fontWeight: "700", color: colors.muted },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleTheirs: { backgroundColor: colors.cardEdge },
  bubbleText: { fontSize: typeSize.body, lineHeight: 22, color: colors.text },
  bubbleTextMine: { color: colors.onPrimary },
  time: { fontSize: 12, color: colors.muted },
  error: { marginHorizontal: 16, marginBottom: 6, fontSize: typeSize.meta, fontWeight: "600", color: colors.danger },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.row, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper, fontSize: typeSize.body, color: colors.text },
  inputOver: { borderColor: colors.danger },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  sendOff: { opacity: 0.4 },
  counter: { paddingHorizontal: 16, paddingBottom: 8, textAlign: "right", fontSize: 12, color: colors.muted, backgroundColor: colors.surface },
  counterOver: { color: colors.danger, fontWeight: "700" },
})
