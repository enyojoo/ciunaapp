import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react-native"
import { accountFieldLabel, accountFieldPlaceholder } from "@/lib/account-field-i18n"
import { Field } from "@/components/field"
import { CurrencyFlag } from "@/components/currency-flag"
import { getAccountTypeConfigFromCurrency } from "@/lib/currency-account-types"
import type { RecipientFormData } from "@/lib/recipient-form-data"
import {
  formatAccountNumber,
  formatIBAN,
  formatRoutingNumber,
  formatSortCode,
} from "@/lib/recipient-formatters"
import type { CurrencyRow } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

function ToggleButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.toggle, active && styles.toggleActive]}>
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </Pressable>
  )
}

export function RecipientFormFields({
  form,
  onChange,
  currencies,
  currencyLocked = false,
  submitting = false,
  onOpenCurrencyPicker,
}: {
  form: RecipientFormData
  onChange: (patch: Partial<RecipientFormData>) => void
  currencies: CurrencyRow[]
  currencyLocked?: boolean
  submitting?: boolean
  onOpenCurrencyPicker?: () => void
}) {
  const { t } = useTranslation("app")
  const set = (patch: Partial<RecipientFormData>) => onChange(patch)

  const selectedCurrency = currencies.find((c) => c.code === form.currency)
  const accountConfig = useMemo(() => getAccountTypeConfigFromCurrency(form.currency), [form.currency])

  const label = (key: string, fallback: string) => accountFieldLabel(t, key, fallback)
  const placeholder = (key: string, fallback: string) => accountFieldPlaceholder(t, key, fallback)

  return (
    <View style={styles.root}>
      <Text style={styles.sectionLabel}>{t("recipients.currency")}</Text>
      <Pressable
        onPress={() => !currencyLocked && onOpenCurrencyPicker?.()}
        style={[styles.selectBox, currencyLocked && styles.selectBoxLocked]}
        disabled={currencyLocked || submitting}
      >
        <View style={styles.currencyValue}>
          <CurrencyFlag code={form.currency} flagSvg={selectedCurrency?.flag_svg} size={20} />
          <Text style={styles.selectText}>
            {selectedCurrency ? `${selectedCurrency.code} — ${selectedCurrency.name || ""}` : form.currency}
          </Text>
        </View>
        {currencyLocked ? (
          <Text style={styles.autoTag}>{t("send.autoSelected", { defaultValue: "Auto-selected" })}</Text>
        ) : (
          <ChevronDown size={18} color={colors.muted} />
        )}
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
          <Text style={styles.sectionLabel}>{t("recipients.transferType")}</Text>
          <View style={styles.toggleRow}>
            <ToggleButton label="ACH" active={form.transferType === "ACH"} onPress={() => set({ transferType: "ACH" })} />
            <ToggleButton label="Wire" active={form.transferType === "Wire"} onPress={() => set({ transferType: "Wire" })} />
          </View>

          <Text style={styles.sectionLabel}>{label("checking_or_savings", "Account Type")}</Text>
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
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: 0 },
  sectionLabel: { marginBottom: 8, fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
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
    gap: 8,
  },
  selectBoxLocked: { backgroundColor: colors.heroBody },
  currencyValue: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  selectText: { fontSize: typeSize.body, color: colors.text, flexShrink: 1 },
  autoTag: { fontSize: 11, fontWeight: "600", color: colors.muted },
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
})
