import { useEffect, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react-native"
import { WebAwareModal } from "@/components/web-aware-modal"
import { PrimaryButton } from "@/components/primary-button"
import { RecipientFormFields } from "@/components/recipient/recipient-form-fields"
import { useToast } from "@/components/toast-provider"
import { fetchWithAuth } from "@/lib/api"
import {
  EMPTY_RECIPIENT_FORM,
  isRecipientFormValid,
  recipientFormToApiBody,
  type RecipientFormData,
} from "@/lib/recipient-form-data"
import type { CurrencyRow, RecipientRow } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

export function AddRecipientSheet({
  open,
  receiveCurrency,
  currencies,
  onClose,
  onCreated,
}: {
  open: boolean
  receiveCurrency: string
  currencies: CurrencyRow[]
  onClose: () => void
  onCreated: (recipient: RecipientRow) => void
}) {
  const { t } = useTranslation("app")
  const { showError, showSuccess } = useToast()
  const [form, setForm] = useState<RecipientFormData>(EMPTY_RECIPIENT_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ ...EMPTY_RECIPIENT_FORM, currency: receiveCurrency })
    setSubmitting(false)
  }, [open, receiveCurrency])

  const valid = isRecipientFormValid(form, submitting)

  const submit = async () => {
    if (!valid) return
    setSubmitting(true)
    try {
      const res = await fetchWithAuth("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipientFormToApiBody(form)),
      })
      const body = (await res.json().catch(() => ({}))) as { recipient?: RecipientRow; error?: string }
      if (!res.ok || !body.recipient) {
        showError(body.error || t("send.failedAddRecipient"))
        return
      }
      showSuccess(t("recipients.addRecipient"))
      onCreated(body.recipient)
      onClose()
    } catch {
      showError(t("send.failedAddRecipient"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <WebAwareModal visible={open} onRequestClose={onClose} wide sheetStyle={styles.sheet}>
      <View style={styles.head}>
        <Text style={styles.title}>{t("send.addNewRecipientTitle")}</Text>
        <Pressable onPress={onClose} style={styles.close} accessibilityLabel="Close">
          <X size={20} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <RecipientFormFields
          form={form}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          currencies={currencies}
          currencyLocked
          submitting={submitting}
        />
        <PrimaryButton
          label={t("send.addRecipientBtn", { defaultValue: "Add recipient" })}
          onPress={() => void submit()}
          busy={submitting}
          disabled={!valid}
        />
      </ScrollView>
    </WebAwareModal>
  )
}

const styles = StyleSheet.create({
  sheet: { maxHeight: "92%" },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, fontSize: 18, fontWeight: "700", color: colors.text },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  scroll: { maxHeight: 520 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, gap: 8 },
})
