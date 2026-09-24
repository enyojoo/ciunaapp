import { useEffect, useState } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { CurrencyFlag } from "@/components/currency-flag"
import { SheetPicker } from "@/components/sheet-picker"
import { RecipientFormFields } from "@/components/recipient/recipient-form-fields"
import { useToast } from "@/components/toast-provider"
import { fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useFx } from "@/lib/use-fx"
import { useRecipients } from "@/lib/use-recipients"
import {
  EMPTY_RECIPIENT_FORM,
  isRecipientFormValid,
  recipientFormFromRow,
  recipientFormToApiBody,
  type RecipientFormData,
} from "@/lib/recipient-form-data"
import { colors } from "@/lib/theme"
import type { CurrencyRow } from "@/lib/types"

export default function RecipientFormScreen() {
  const { t } = useTranslation("app")
  const navigation = useNavigation()
  const router = useRouter()
  const { showError, showSuccess } = useToast()
  const { currencies } = useFx()
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const { data: recipients, loading: recipientsLoading, revalidate } = useRecipients(user?.id)

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? t("recipients.editRecipientTitle") : t("recipients.addNewTitle") })
  }, [navigation, t, isEdit])

  const [form, setForm] = useState<RecipientFormData>(EMPTY_RECIPIENT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const loading = isEdit && recipientsLoading

  useEffect(() => {
    if (!isEdit || !recipients) return
    const found = recipients.find((r) => r.id === id)
    if (found) setForm(recipientFormFromRow(found))
  }, [isEdit, id, recipients])

  const isValid = isRecipientFormValid(form, submitting)

  const submit = async () => {
    if (!isValid) return
    setSubmitting(true)
    if (isEdit && id) {
      const { error } = await supabase
        .from("recipients")
        .update({
          full_name: form.name.trim(),
          account_number: form.accountNumber.trim() || null,
          bank_name: form.bankName.trim(),
          routing_number: form.routingNumber.trim() || null,
          sort_code: form.sortCode.trim() || null,
          iban: form.iban.trim() || null,
          swift_bic: form.swiftBic.trim() || null,
          address_line1: form.addressLine1.trim() || null,
          address_line2: form.addressLine2.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          postal_code: form.postalCode.trim() || null,
          transfer_type: form.transferType || null,
          checking_or_savings: form.checkingOrSavings || null,
        })
        .eq("id", id)
      setSubmitting(false)
      if (error) {
        showError(t("recipients.failedUpdate"))
        return
      }
      showSuccess(t("recipients.updateRecipient"))
      revalidate()
    } else {
      const res = await fetchWithAuth("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipientFormToApiBody(form)),
      })
      setSubmitting(false)
      if (!res.ok) {
        showError(t("recipients.failedAdd"))
        return
      }
      showSuccess(t("recipients.addRecipient"))
      revalidate()
    }
    router.back()
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
    <ScreenScroll edges={["left", "right"]} keyboard>
      <RecipientFormFields
        form={form}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        currencies={currencies}
        currencyLocked={isEdit}
        submitting={submitting}
        onOpenCurrencyPicker={isEdit ? undefined : () => setCurrencyOpen(true)}
      />

      <View style={styles.submitWrap}>
        <PrimaryButton
          label={submitting ? t("recipients.saving") : isEdit ? t("recipients.updateRecipient") : t("recipients.addRecipient")}
          onPress={() => void submit()}
          busy={submitting}
          disabled={!isValid}
        />
      </View>

      <SheetPicker<CurrencyRow>
        open={currencyOpen}
        title={t("recipients.currency")}
        items={currencies}
        keyExtractor={(c) => c.code}
        labelExtractor={(c) => `${c.code} — ${c.name || ""}`}
        leadingExtractor={(c) => <CurrencyFlag code={c.code} flagSvg={c.flag_svg} size={20} />}
        selectedId={form.currency}
        onSelect={(c) => setForm((prev) => ({ ...prev, currency: c.code }))}
        onClose={() => setCurrencyOpen(false)}
      />
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 80, alignItems: "center" },
  submitWrap: { marginTop: 16 },
})
