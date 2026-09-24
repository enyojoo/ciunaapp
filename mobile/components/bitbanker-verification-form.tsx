import { type ReactNode, useEffect, useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Check, ChevronDown } from "lucide-react-native"
import { CountryPicker } from "@/components/country-picker"
import { FlagIcon } from "@/components/flag-icon"
import { Field } from "@/components/field"
import { PrimaryButton } from "@/components/primary-button"
import { fetchWithAuth } from "@/lib/api"
import { countryService, type Country } from "@/lib/country-service"
import { colors, radius, type as typeSize } from "@/lib/theme"
import {
  isRussianPassportCountry,
  validateBitbankerVerificationInput,
  type BitbankerVerificationErrorCode,
  type BitbankerVerificationField,
  type BitbankerVerificationFormInput,
} from "@ciuna/shared"

type Props = {
  defaultEmail?: string
  onSubmitted?: () => void
}

const emptyForm = (defaultEmail: string, foreign: boolean): BitbankerVerificationFormInput => ({
  email: defaultEmail,
  phone: "",
  passportCountry: foreign ? "" : "RU",
  firstName: "",
  lastName: "",
  patronymic: "",
  firstNameNative: "",
  lastNameNative: "",
  birthDate: "",
  passportNumber: "",
  passportIssueDate: "",
  registrationCountry: "RUS",
  registrationCity: "",
  registrationStreet: "",
  registrationHouse: "",
  registrationIndex: "",
  consent: false,
})

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionHeading}>{title}</Text>
      <View style={styles.sectionInner}>{children}</View>
    </View>
  )
}

export function BitbankerVerificationForm({ defaultEmail = "", onSubmitted }: Props) {
  const { t } = useTranslation("app")
  const [foreignPassport, setForeignPassport] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<BitbankerVerificationField, BitbankerVerificationErrorCode>>
  >({})
  const [form, setForm] = useState(() => emptyForm(defaultEmail, false))
  const [countries, setCountries] = useState<Country[]>([])
  const [countryOpen, setCountryOpen] = useState(false)

  useEffect(() => {
    void countryService.getAll().then(setCountries)
  }, [])

  const selectedPassportCountry = useMemo(
    () => countries.find((c) => c.code === form.passportCountry) ?? null,
    [countries, form.passportCountry],
  )

  const isForeign = useMemo(
    () => foreignPassport || !isRussianPassportCountry(form.passportCountry || "RU"),
    [foreignPassport, form.passportCountry],
  )

  const err = (field: BitbankerVerificationField) => {
    const code = fieldErrors[field]
    return code ? t(`verification.bitbanker.errors.${code}`) : undefined
  }

  const set = <K extends keyof BitbankerVerificationFormInput>(key: K, value: BitbankerVerificationFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      if (!prev[key as BitbankerVerificationField]) return prev
      const next = { ...prev }
      delete next[key as BitbankerVerificationField]
      return next
    })
  }

  const setPassportKind = (foreign: boolean) => {
    setForeignPassport(foreign)
    setForm((prev) => ({
      ...prev,
      passportCountry: foreign
        ? isRussianPassportCountry(prev.passportCountry)
          ? ""
          : prev.passportCountry
        : "RU",
    }))
  }

  const onPassportCountrySelect = (country: Country) => {
    if (isRussianPassportCountry(country.code)) {
      setForeignPassport(false)
      set("passportCountry", "RU")
      return
    }
    setForeignPassport(true)
    set("passportCountry", country.code)
  }

  const submit = async () => {
    setFormError(null)
    const payload = {
      ...form,
      passportCountry: isForeign ? form.passportCountry : "RU",
      ...(isForeign
        ? {
            firstName: form.firstNameNative?.trim() || form.firstName,
            lastName: form.lastNameNative?.trim() || form.lastName,
            registrationCountry: form.registrationCountry?.trim() || "RUS",
          }
        : {}),
    }
    const validated = validateBitbankerVerificationInput(payload)
    if (!validated.ok) {
      setFieldErrors(validated.errors)
      setFormError(t("verification.bitbanker.errors.validation_failed"))
      return
    }
    setFieldErrors({})
    setBusy(true)
    const res = await fetchWithAuth("/api/bitbanker/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        idempotencyKey: `mobile-verify-${payload.email.trim()}-${payload.passportNumber.trim().replace(/\s+/g, "")}`,
      }),
    })
    const body = (await res.json().catch(() => ({}))) as {
      error?: string
      fieldErrors?: Partial<Record<BitbankerVerificationField, BitbankerVerificationErrorCode>>
    }
    setBusy(false)
    if (!res.ok) {
      if (body.fieldErrors) setFieldErrors(body.fieldErrors)
      setFormError(body.error || t("verification.bitbanker.errors.submit_failed"))
      return
    }
    onSubmitted?.()
  }

  return (
    <View style={styles.form}>
      <View style={styles.segmentRow}>
        <Pressable
          onPress={() => setPassportKind(false)}
          style={[styles.segment, !foreignPassport && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, !foreignPassport && styles.segmentTextActive]}>
            {t("verification.passportSegmentRu")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPassportKind(true)}
          style={[styles.segment, foreignPassport && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, foreignPassport && styles.segmentTextActive]}>
            {t("verification.passportSegmentForeign")}
          </Text>
        </Pressable>
      </View>

      {foreignPassport ? (
        <View style={styles.foreignCountry}>
          <Text style={styles.fieldLabel}>{t("verification.labelCountry")}</Text>
          <Pressable onPress={() => setCountryOpen(true)} style={styles.selectBox}>
            <View style={styles.selectValue}>
              {selectedPassportCountry ? <FlagIcon code={selectedPassportCountry.code} size={18} /> : null}
              <Text style={[styles.selectText, !selectedPassportCountry && styles.selectPlaceholder]}>
                {selectedPassportCountry
                  ? selectedPassportCountry.name
                  : t("verification.placeholderSelectCountry")}
              </Text>
            </View>
            <ChevronDown size={18} color={colors.muted} />
          </Pressable>
          {err("passportCountry") ? <Text style={styles.fieldError}>{err("passportCountry")}</Text> : null}
        </View>
      ) : null}

      <FormSection title={t("verification.formSectionName")}>
        {isForeign ? (
          <>
            <Field
              label={t("verification.bitbanker.firstNameNative")}
              value={form.firstNameNative ?? ""}
              onChangeText={(v) => set("firstNameNative", v)}
              error={err("firstNameNative")}
            />
            <Field
              label={t("verification.bitbanker.lastNameNative")}
              value={form.lastNameNative ?? ""}
              onChangeText={(v) => set("lastNameNative", v)}
              error={err("lastNameNative")}
            />
          </>
        ) : (
          <>
            <Field
              label={t("verification.formFirstName")}
              value={form.firstName}
              onChangeText={(v) => set("firstName", v)}
              error={err("firstName")}
            />
            <Field
              label={t("verification.formLastName")}
              value={form.lastName}
              onChangeText={(v) => set("lastName", v)}
              error={err("lastName")}
            />
            <Field
              label={t("verification.formPatronymic")}
              value={form.patronymic ?? ""}
              onChangeText={(v) => set("patronymic", v)}
              error={err("patronymic")}
            />
          </>
        )}
      </FormSection>

      {isForeign ? (
        <FormSection title={t("verification.formSectionAddress")}>
          <Field
            label={t("verification.bitbanker.registrationCity")}
            value={form.registrationCity ?? ""}
            onChangeText={(v) => set("registrationCity", v)}
            error={err("registrationCity")}
          />
          <Field
            label={t("verification.bitbanker.registrationStreet")}
            value={form.registrationStreet ?? ""}
            onChangeText={(v) => set("registrationStreet", v)}
            error={err("registrationStreet")}
          />
          <Field
            label={t("verification.bitbanker.registrationHouse")}
            value={form.registrationHouse ?? ""}
            onChangeText={(v) => set("registrationHouse", v)}
            error={err("registrationHouse")}
          />
        </FormSection>
      ) : null}

      <FormSection title={t("verification.formSectionPassport")}>
        <Field
          label={t("verification.formPassportNumber")}
          value={form.passportNumber}
          onChangeText={(v) => set("passportNumber", v.replace(/\s+/g, ""))}
          error={err("passportNumber")}
        />
        <View style={styles.dateRow}>
          <View style={styles.dateHalf}>
            <Field
              label={t("verification.formBirthDate")}
              value={form.birthDate}
              onChangeText={(v) => set("birthDate", v)}
              placeholder={t("verification.formDatePlaceholder")}
              error={err("birthDate")}
            />
          </View>
          <View style={styles.dateHalf}>
            <Field
              label={t("verification.formPassportIssueDate")}
              value={form.passportIssueDate}
              onChangeText={(v) => set("passportIssueDate", v)}
              placeholder={t("verification.formDatePlaceholder")}
              error={err("passportIssueDate")}
            />
          </View>
        </View>
      </FormSection>

      <FormSection title={t("verification.formSectionContact")}>
        <Field
          label={t("verification.bitbanker.phone")}
          value={form.phone ?? ""}
          onChangeText={(v) => set("phone", v)}
          keyboardType="phone-pad"
          placeholder="+79001234567"
          error={err("phone")}
        />
        <Field
          label={t("verification.bitbanker.email")}
          value={form.email}
          onChangeText={(v) => set("email", v)}
          keyboardType="email-address"
          autoCapitalize="none"
          error={err("email")}
        />
      </FormSection>

      <Pressable
        onPress={() => set("consent", !form.consent)}
        style={[styles.consentRow, form.consent && styles.consentRowOn]}
      >
        <View style={[styles.checkbox, form.consent && styles.checkboxOn]}>
          {form.consent ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
        </View>
        <Text style={styles.consentText}>{t("verification.formConsentShort")}</Text>
      </Pressable>
      {err("consent") ? <Text style={styles.formError}>{err("consent")}</Text> : null}
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <PrimaryButton
        label={busy ? t("verification.bitbanker.submitting") : t("verification.submit")}
        onPress={() => void submit()}
        busy={busy}
        disabled={!form.consent}
      />

      <CountryPicker
        open={countryOpen}
        title={t("verification.labelCountry")}
        searchPlaceholder={t("verification.searchCountries")}
        countries={countries}
        selectedCode={form.passportCountry || null}
        onSelect={onPassportCountrySelect}
        onClose={() => setCountryOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  form: { paddingBottom: 32, paddingTop: 4 },
  segmentRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    padding: 4,
    borderRadius: radius.row,
    backgroundColor: colors.border,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.muted, textAlign: "center" },
  segmentTextActive: { color: colors.text },
  foreignCountry: { marginBottom: 12 },
  fieldLabel: { marginBottom: 8, fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  selectBox: {
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
  selectValue: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  selectText: { fontSize: typeSize.body, color: colors.text },
  selectPlaceholder: { color: colors.muted },
  fieldError: { marginTop: 6, fontSize: typeSize.meta, color: colors.danger },
  sectionCard: {
    marginBottom: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  sectionHeading: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    fontSize: typeSize.meta,
    fontWeight: "700",
    color: colors.text,
  },
  sectionInner: { paddingHorizontal: 16, paddingBottom: 8 },
  dateRow: { flexDirection: "row", gap: 10 },
  dateHalf: { flex: 1, minWidth: 0 },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
    marginTop: 4,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  consentRowOn: { borderColor: "#FDBA74", backgroundColor: colors.heroBody },
  checkbox: {
    marginTop: 1,
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  consentText: { flex: 1, fontSize: typeSize.meta, lineHeight: 20, color: colors.text },
  formError: { marginBottom: 12, fontSize: typeSize.meta, color: colors.danger },
})
