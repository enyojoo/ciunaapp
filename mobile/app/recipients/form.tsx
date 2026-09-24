import { useEffect, useMemo, useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react-native"
import { accountFieldLabel, accountFieldPlaceholder } from "@/lib/account-field-i18n"
import { Field } from "@/components/field"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { CurrencyFlag } from "@/components/currency-flag"
import { SheetPicker } from "@/components/sheet-picker"
import { useToast } from "@/components/toast-provider"
import { fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useFx } from "@/lib/use-fx"
import { useRecipients } from "@/lib/use-recipients"
import { getAccountTypeConfigFromCurrency } from "@/lib/currency-account-types"
import { formatAccountNumber, formatIBAN, formatRoutingNumber, formatSortCode } from "@/lib/recipient-formatters"
import { colors, radius, type as typeSize } from "@/lib/theme"
import type { CurrencyRow, RecipientRow } from "@/lib/types"

type FormData = {
  name: string
  accountNumber: string
  bankName: string
  currency: string
  routingNumber: string
  sortCode: string
  iban: string
  swiftBic: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  transferType: "ACH" | "Wire" | ""
  checkingOrSavings: "checking" | "savings" | ""
}

const EMPTY_FORM: FormData = {
  name: "",
  accountNumber: "",
  bankName: "",
  currency: "USD",
  routingNumber: "",
  sortCode: "",
  iban: "",
  swiftBic: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  transferType: "",
  checkingOrSavings: "",
}

function fromRecipient(r: RecipientRow): FormData {
  return {
    name: r.full_name || "",
    accountNumber: r.account_number || "",
    bankName: r.bank_name || "",
    currency: r.currency || "USD",
    routingNumber: r.routing_number || "",
    sortCode: r.sort_code || "",
    iban: r.iban || "",
    swiftBic: r.swift_bic || "",
    addressLine1: r.address_line1 || "",
    addressLine2: r.address_line2 || "",
    city: r.city || "",
    state: r.state || "",
    postalCode: r.postal_code || "",
    transferType: r.transfer_type || "",
    checkingOrSavings: r.checking_or_savings || "",
  }
}

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

  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const loading = isEdit && recipientsLoading

  useEffect(() => {
    if (!isEdit || !recipients) return
    const found = recipients.find((r) => r.id === id)
    if (found) setForm(fromRecipient(found))
  }, [isEdit, id, recipients])

  const set = (patch: Partial<FormData>) => setForm((prev) => ({ ...prev, ...patch }))

  const selectedCurrency = currencies.find((c) => c.code === form.currency)
  const accountConfig = useMemo(() => getAccountTypeConfigFromCurrency(form.currency), [form.currency])

  const isValid = useMemo(() => {
    if (!form.name.trim() || !form.bankName.trim() || submitting) return false
    if (accountConfig.accountType === "us" && (!form.transferType || !form.checkingOrSavings)) return false
    for (const field of accountConfig.requiredFields) {
      const key = fieldToStateKey(field)
      if (!form[key]?.trim()) return false
    }
    return true
  }, [form, accountConfig, submitting])

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
        body: JSON.stringify({
          fullName: form.name.trim(),
          accountNumber: form.accountNumber.trim(),
          bankName: form.bankName.trim(),
          currency: form.currency,
          routingNumber: form.routingNumber.trim() || undefined,
          sortCode: form.sortCode.trim() || undefined,
          iban: form.iban.trim() || undefined,
          swiftBic: form.swiftBic.trim() || undefined,
          addressLine1: form.addressLine1.trim() || undefined,
          addressLine2: form.addressLine2.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
          transferType: form.transferType || undefined,
          checkingOrSavings: form.checkingOrSavings || undefined,
        }),
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

  const label = (key: string, fallback: string) => accountFieldLabel(t, key, fallback)
  const placeholder = (key: string, fallback: string) => accountFieldPlaceholder(t, key, fallback)

  return (
    <ScreenScroll edges={["left", "right"]} keyboard>
      <Text style={styles.label}>{t("recipients.currency")}</Text>
      <Pressable
        onPress={() => !isEdit && setCurrencyOpen(true)}
        style={[styles.selectBox, isEdit && styles.selectBoxDisabled]}
      >
        <View style={styles.currencyValue}>
          <CurrencyFlag code={form.currency} flagSvg={selectedCurrency?.flag_svg} size={20} />
          <Text style={styles.selectText}>
            {selectedCurrency ? `${selectedCurrency.code} — ${selectedCurrency.name || ""}` : form.currency}
          </Text>
        </View>
        {!isEdit ? <ChevronDown size={18} color={colors.muted} /> : null}
      </Pressable>

      <Field
        label={label("account_name", t("recipients.accountName"))}
        value={form.name}
        onChangeText={(v) => set({ name: v })}
        placeholder={t("recipients.enterAccountName")}
        editable={!submitting}
      />

      <Field
        label={label("bank_name", "Bank Name")}
        value={form.bankName}
        onChangeText={(v) => set({ bankName: v })}
        placeholder={placeholder("bank_name", "e.g., Bank Name")}
        editable={!submitting}
      />

      {accountConfig.accountType === "us" ? (
        <>
          <Text style={styles.label}>{t("recipients.transferType")}</Text>
          <View style={styles.toggleRow}>
            <ToggleButton
              label="ACH"
              active={form.transferType === "ACH"}
              onPress={() => set({ transferType: "ACH" })}
            />
            <ToggleButton
              label="Wire"
              active={form.transferType === "Wire"}
              onPress={() => set({ transferType: "Wire" })}
            />
          </View>

          <Text style={styles.label}>{label("checking_or_savings", "Account Type")}</Text>
          <View style={styles.toggleRow}>
            <ToggleButton
              label={t("recipients.checking")}
              active={form.checkingOrSavings === "checking"}
              onPress={() => set({ checkingOrSavings: "checking" })}
            />
            <ToggleButton
              label={t("recipients.savings")}
              active={form.checkingOrSavings === "savings"}
              onPress={() => set({ checkingOrSavings: "savings" })}
            />
          </View>

          <Field
            label={label("routing_number", "Routing Number")}
            value={form.routingNumber}
            onChangeText={(v) => set({ routingNumber: formatRoutingNumber(v) })}
            placeholder={placeholder("routing_number", "e.g., 123456789")}
            keyboardType="number-pad"
            maxLength={9}
            editable={!submitting}
          />
          <Field
            label={label("account_number", "Account Number")}
            value={form.accountNumber}
            onChangeText={(v) => set({ accountNumber: formatAccountNumber(v) })}
            placeholder={placeholder("account_number", "e.g., 1234567890")}
            keyboardType="number-pad"
            editable={!submitting}
          />
          <Field
            label={label("address_line1", "Address Line 1")}
            value={form.addressLine1}
            onChangeText={(v) => set({ addressLine1: v })}
            placeholder={placeholder("address_line1", "e.g., 123 Main Street")}
            editable={!submitting}
          />
          <Field
            label={label("address_line2", "Address Line 2")}
            value={form.addressLine2}
            onChangeText={(v) => set({ addressLine2: v })}
            placeholder={placeholder("address_line2", "Apt 4B (optional)")}
            editable={!submitting}
          />
          <View style={styles.row2}>
            <View style={styles.row2Item}>
              <Field
                label={label("city", "City")}
                value={form.city}
                onChangeText={(v) => set({ city: v })}
                placeholder={placeholder("city", "e.g., New York")}
                editable={!submitting}
              />
            </View>
            <View style={styles.row2Item}>
              <Field
                label={label("state", "State")}
                value={form.state}
                onChangeText={(v) => set({ state: v.toUpperCase() })}
                placeholder={placeholder("state", "e.g., NY")}
                maxLength={2}
                autoCapitalize="characters"
                editable={!submitting}
              />
            </View>
          </View>
          <Field
            label={label("postal_code", "ZIP Code")}
            value={form.postalCode}
            onChangeText={(v) => set({ postalCode: v.replace(/\D/g, "").slice(0, 10) })}
            placeholder={placeholder("postal_code", "e.g., 10001")}
            keyboardType="number-pad"
            editable={!submitting}
          />
        </>
      ) : null}

      {accountConfig.accountType === "uk" ? (
        <>
          <View style={styles.row2}>
            <View style={styles.row2Item}>
              <Field
                label={label("sort_code", "Sort Code")}
                value={form.sortCode}
                onChangeText={(v) => set({ sortCode: formatSortCode(v) })}
                placeholder={placeholder("sort_code", "e.g., 123456")}
                keyboardType="number-pad"
                maxLength={8}
                editable={!submitting}
              />
            </View>
            <View style={styles.row2Item}>
              <Field
                label={label("account_number", "Account Number")}
                value={form.accountNumber}
                onChangeText={(v) => set({ accountNumber: formatAccountNumber(v) })}
                placeholder={placeholder("account_number", "e.g., 12345678")}
                keyboardType="number-pad"
                editable={!submitting}
              />
            </View>
          </View>
          <Field
            label={label("iban", "IBAN")}
            value={form.iban}
            onChangeText={(v) => set({ iban: formatIBAN(v) })}
            placeholder={placeholder("iban", "e.g., GB82 WEST 1234 5698 7654 32")}
            autoCapitalize="characters"
            editable={!submitting}
          />
          <Field
            label={`${label("swift_bic", "SWIFT/BIC")}${t("recipients.optionalSuffix")}`}
            value={form.swiftBic}
            onChangeText={(v) => set({ swiftBic: v.toUpperCase() })}
            placeholder={placeholder("swift_bic", "e.g., NWBKGB2L")}
            autoCapitalize="characters"
            editable={!submitting}
          />
        </>
      ) : null}

      {accountConfig.accountType === "euro" ? (
        <>
          <Field
            label={label("iban", "IBAN")}
            value={form.iban}
            onChangeText={(v) => set({ iban: formatIBAN(v) })}
            placeholder={placeholder("iban", "e.g., DE89 3704 0044 0532 0130 00")}
            autoCapitalize="characters"
            editable={!submitting}
          />
          <Field
            label={`${label("swift_bic", "SWIFT/BIC")}${t("recipients.optionalSuffix")}`}
            value={form.swiftBic}
            onChangeText={(v) => set({ swiftBic: v.toUpperCase() })}
            placeholder={placeholder("swift_bic", "e.g., COBADEFFXXX")}
            autoCapitalize="characters"
            editable={!submitting}
          />
        </>
      ) : null}

      {accountConfig.accountType === "generic" ? (
        <Field
          label={label("account_number", "Account Number")}
          value={form.accountNumber}
          onChangeText={(v) => set({ accountNumber: v })}
          placeholder={placeholder("account_number", "e.g., 1234567890")}
          editable={!submitting}
        />
      ) : null}

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
        onSelect={(c) => set({ currency: c.code })}
        onClose={() => setCurrencyOpen(false)}
      />
    </ScreenScroll>
  )
}

function ToggleButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.toggle, active && styles.toggleActive]}>
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </Pressable>
  )
}

function fieldToStateKey(field: string): keyof FormData {
  const map: Record<string, keyof FormData> = {
    account_name: "name",
    routing_number: "routingNumber",
    account_number: "accountNumber",
    bank_name: "bankName",
    sort_code: "sortCode",
    iban: "iban",
    swift_bic: "swiftBic",
    address_line1: "addressLine1",
    address_line2: "addressLine2",
    city: "city",
    state: "state",
    postal_code: "postalCode",
    checking_or_savings: "checkingOrSavings",
  }
  return map[field] ?? "name"
}

const styles = StyleSheet.create({
  center: { paddingVertical: 80, alignItems: "center" },
  label: { marginBottom: 8, fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  selectBox: {
    marginBottom: 14,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  selectBoxDisabled: { opacity: 0.6 },
  currencyValue: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  selectText: { fontSize: typeSize.body, color: colors.text },
  toggleRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  toggle: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toggleActive: { borderColor: colors.primary, backgroundColor: colors.heroBody },
  toggleText: { fontSize: typeSize.body, fontWeight: "600", color: colors.muted },
  toggleTextActive: { color: colors.primaryDeep },
  row2: { flexDirection: "row", gap: 12 },
  row2Item: { flex: 1 },
  submitWrap: { marginTop: 16 },
})
