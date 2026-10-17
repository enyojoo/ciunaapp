import { useCallback, useEffect, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { X } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { AppTextInput } from "@/components/app-text-input"
import { PrimaryButton } from "@/components/primary-button"
import { RatingInput, RatingStars } from "@/components/rating-stars"
import { useToast } from "@/components/toast-provider"
import { WebAwareModal } from "@/components/web-aware-modal"
import { useAuth } from "@/lib/auth-context"
import { ApiError, authJson } from "@/lib/social-api"
import { colors, radius, type as typeSize } from "@/lib/theme"

const MAX_BODY = 1000
const EDIT_HOURS = 48

type OwnReview = {
  id: string
  rating: number
  body: string
  created_at: string
  editable: boolean
  reply?: string | null
}
type ReviewState = { review: OwnReview | null; canReview: boolean; canEdit: boolean; reason: string | null }

const chars = (s: string) => [...s].length

function useOrderReview(orderId: string, enabled: boolean) {
  const [state, setState] = useState<ReviewState | null>(null)
  const [error, setError] = useState(false)
  const load = useCallback(async () => {
    setError(false)
    try {
      setState(await authJson<ReviewState>(`/api/hub/orders/${encodeURIComponent(orderId)}/review`))
    } catch {
      setError(true)
    }
  }, [orderId])
  useEffect(() => {
    if (enabled) void load()
  }, [enabled, load])
  return { state, error, reload: load, setState }
}

/** "Rate your order" prompt, or the customer's own review, on a completed order. Hidden when no review is possible. */
export function OrderReviewCard({ orderId, fulfilled, line }: { orderId: string; fulfilled: boolean; line?: string }) {
  const { t } = useTranslation("app")
  const { state, error, reload, setState } = useOrderReview(orderId, fulfilled)
  const [open, setOpen] = useState(false)
  if (!fulfilled) return null

  if (error && !state) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardHint}>{t("social.loadFailed", { defaultValue: "Couldn't load, try again" })}</Text>
        <Pressable onPress={() => void reload()} accessibilityRole="button" hitSlop={8} style={styles.linkHit}>
          <Text style={styles.link}>{t("social.retry", { defaultValue: "Try again" })}</Text>
        </Pressable>
      </View>
    )
  }
  if (!state) return null
  const review = state.review
  if (!review && !state.canReview) return null

  return (
    <>
      <View style={styles.card}>
        {review ? (
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{t("reviews.yourReview", { defaultValue: "Your review" })}</Text>
            <RatingStars value={review.rating} size={16} />
            {review.body ? (
              <Text style={styles.cardText} numberOfLines={3}>
                {review.body}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{(line === "experts" ? t("reviews.promptTitleSession", { defaultValue: "Rate your session" }) : t("reviews.promptTitle", { defaultValue: "Rate your order" }))}</Text>
            <Text style={styles.cardHint}>
              {t("reviews.promptHint", { defaultValue: "How was it? Your rating helps other customers." })}
            </Text>
          </View>
        )}
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          style={styles.cardButton}
        >
          <Text style={styles.cardButtonText}>
            {review
              ? state.canEdit
                ? t("reviews.edit", { defaultValue: "Edit" })
                : t("reviews.view", { defaultValue: "View" })
              : t("reviews.rate", { defaultValue: "Rate" })}
          </Text>
        </Pressable>
      </View>
      <ReviewSheet
        open={open}
        orderId={orderId}
        line={line}
        review={review}
        canEdit={state.canEdit}
        onClose={() => setOpen(false)}
        onSaved={(next) => {
          setState({ review: next, canReview: true, canEdit: next.editable, reason: null })
          setOpen(false)
        }}
        onLocked={() => void reload()}
      />
    </>
  )
}

function ReviewSheet({
  open,
  orderId,
  line,
  review,
  canEdit,
  onClose,
  onSaved,
  onLocked,
}: {
  open: boolean
  orderId: string
  line?: string
  review: OwnReview | null
  canEdit: boolean
  onClose: () => void
  onSaved: (review: OwnReview) => void
  onLocked: () => void
}) {
  const { t, i18n } = useTranslation("app")
  const { profile } = useAuth()
  const { showSuccess } = useToast()
  const locked = Boolean(review) && !canEdit
  const [rating, setRating] = useState(0)
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setRating(review?.rating ?? 0)
    setText(review?.body ?? "")
    setError("")
    setBusy(false)
  }, [open, review])

  const words = [
    t("reviews.star1", { defaultValue: "Poor" }),
    t("reviews.star2", { defaultValue: "Fair" }),
    t("reviews.star3", { defaultValue: "Good" }),
    t("reviews.star4", { defaultValue: "Very good" }),
    t("reviews.star5", { defaultValue: "Excellent" }),
  ]
  const first = (profile?.first_name || "").trim().split(/\s+/)[0]
  const over = chars(text) > MAX_BODY
  const title = locked
    ? t("reviews.lockedTitle", { defaultValue: "Your review" })
    : review
      ? t("reviews.editTitle", { defaultValue: "Edit your review" })
      : (line === "experts" ? t("reviews.sheetTitleSession", { defaultValue: "Rate your session" }) : t("reviews.sheetTitle", { defaultValue: "Rate your order" }))

  let editUntil = ""
  if (review && canEdit) {
    try {
      editUntil = new Date(new Date(review.created_at).getTime() + EDIT_HOURS * 3_600_000).toLocaleString(
        i18n.resolvedLanguage || i18n.language || "en",
        { dateStyle: "medium", timeStyle: "short" },
      )
    } catch {
      editUntil = ""
    }
  }

  const submit = async () => {
    if (!rating || over || busy) return
    setBusy(true)
    setError("")
    try {
      const res = await authJson<{ review: OwnReview }>(`/api/hub/orders/${encodeURIComponent(orderId)}/review`, {
        method: "POST",
        body: { rating, body: text.trim(), language: (i18n.resolvedLanguage || i18n.language || "en").slice(0, 12) },
      })
      showSuccess(
        review
          ? t("reviews.updated", { defaultValue: "Your review is updated" })
          : t("reviews.thanks", { defaultValue: "Thanks, your review is posted" }),
      )
      onSaved(res.review)
    } catch (e) {
      const code = e instanceof ApiError ? e.code : ""
      if (code === "ALREADY_REVIEWED") {
        onLocked()
        setError(t("reviews.lockedNote", { defaultValue: "Reviews can be edited for 48 hours. This one is now locked." }))
      } else if (code === "REVIEW_WINDOW_CLOSED") {
        setError(t("reviews.windowClosed", { defaultValue: "The review period for this order has ended." }))
      } else if (e instanceof ApiError && e.status === 429) {
        setError(t("reviews.rateLimited", { defaultValue: "Too many attempts. Try again in a minute." }))
      } else {
        setError(t("reviews.postFailed", { defaultValue: "Couldn't post your review. Try again." }))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <WebAwareModal visible={open} onRequestClose={onClose}>
      <View style={styles.head}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <Pressable
          onPress={onClose}
          style={styles.close}
          accessibilityRole="button"
          accessibilityLabel={t("reviews.close", { defaultValue: "Close" })}
        >
          <X size={20} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
        <RatingInput value={rating} onChange={setRating} locked={locked} />
        <Text style={styles.word}>{rating ? words[rating - 1] : " "}</Text>

        {locked ? (
          <>
            {review?.body ? <Text style={styles.lockedText}>{review.body}</Text> : null}
            <Text style={styles.note}>
              {t("reviews.lockedNote", { defaultValue: "Reviews can be edited for 48 hours. This one is now locked." })}
            </Text>
          </>
        ) : (
          <>
            <AppTextInput
              value={text}
              onChangeText={setText}
              multiline
              placeholder={t("reviews.bodyPlaceholder", { defaultValue: "Tell others what you thought (optional)" })}
              placeholderTextColor={colors.subtle}
              accessibilityLabel={t("reviews.bodyPlaceholder", { defaultValue: "Tell others what you thought (optional)" })}
              style={[styles.input, over && styles.inputOver]}
            />
            <Text style={[styles.counter, over && styles.counterOver]}>
              {chars(text)} / {MAX_BODY}
            </Text>
            <Text style={styles.note}>
              {first
                ? t("reviews.notice", { name: first, defaultValue: "Shown with your first name only: {{name}}" })
                : t("reviews.noticeNoName", { defaultValue: "Shown with your first name only." })}
            </Text>
            {editUntil ? (
              <Text style={styles.note}>
                {t("reviews.editUntil", { date: editUntil, defaultValue: "You can edit this review until {{date}}." })}
              </Text>
            ) : null}
            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            <View style={styles.actions}>
              <PrimaryButton
                label={
                  review
                    ? t("reviews.save", { defaultValue: "Save changes" })
                    : t("reviews.submit", { defaultValue: "Submit review" })
                }
                busy={busy}
                disabled={!rating || over}
                onPress={() => void submit()}
              />
              <PrimaryButton
                label={t("reviews.cancel", { defaultValue: "Cancel" })}
                variant="ghost"
                onPress={onClose}
              />
            </View>
          </>
        )}
      </ScrollView>
    </WebAwareModal>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  cardBody: { flex: 1, minWidth: 0, gap: 4 },
  cardTitle: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
  cardHint: { flex: 1, fontSize: typeSize.meta, color: colors.muted },
  cardText: { fontSize: typeSize.meta, color: colors.text },
  cardButton: {
    minHeight: 40,
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
  },
  cardButtonText: { fontSize: typeSize.meta, fontWeight: "700", color: colors.onPrimary },
  linkHit: { minHeight: 44, justifyContent: "center" },
  link: { fontSize: typeSize.meta, fontWeight: "600", color: colors.primaryText },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  sheetTitle: { fontSize: typeSize.headline, fontWeight: "600", color: colors.text },
  close: { height: 44, width: 44, alignItems: "center", justifyContent: "center" },
  sheetBody: { paddingHorizontal: 20, paddingBottom: 28 },
  word: { marginTop: 2, marginBottom: 14, textAlign: "center", fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  input: {
    minHeight: 110,
    textAlignVertical: "top",
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    fontSize: typeSize.body,
    color: colors.text,
  },
  inputOver: { borderColor: colors.danger },
  counter: { marginTop: 6, textAlign: "right", fontSize: typeSize.caption, color: colors.muted },
  counterOver: { color: colors.danger, fontWeight: "700" },
  note: { marginTop: 8, fontSize: typeSize.meta, color: colors.muted },
  lockedText: { marginTop: 4, fontSize: typeSize.body, lineHeight: 22, color: colors.text },
  error: { marginTop: 10, fontSize: typeSize.meta, color: colors.danger, fontWeight: "600" },
  actions: { marginTop: 16, gap: 4 },
})
