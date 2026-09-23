import { useMemo, useState } from "react"
import { Pressable, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Field } from "@/components/field"
import { PrimaryButton } from "@/components/primary-button"
import { fetchWithAuth } from "@/lib/api"
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

const emptyForm = (defaultEmail: string): BitbankerVerificationFormInput => ({
  email: defaultEmail,
  phone: "",
  passportCountry: "RU",
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

export function BitbankerVerificationForm({ defaultEmail = "", onSubmitted }: Props) {
  const { t } = useTranslation("app")
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<BitbankerVerificationField, BitbankerVerificationErrorCode>>
  >({})
  const [form, setForm] = useState(() => emptyForm(defaultEmail))

  const isForeign = useMemo(() => !isRussianPassportCountry(form.passportCountry), [form.passportCountry])

  const err = (field: BitbankerVerificationField) => {
    const code = fieldErrors[field]
    return code ? t(`verification.bitbanker.errors.${code}`) : null
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

  const submit = async () => {
    setFormError(null)
    const validated = validateBitbankerVerificationInput(form)
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
        ...form,
        idempotencyKey: `mobile-verify-${form.email.trim()}-${form.passportNumber.trim().replace(/\s+/g, "")}`,
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

  const field = (label: string, key: keyof BitbankerVerificationFormInput, props?: { keyboardType?: "default" | "phone-pad" }) => (
    <View className="mb-3">
      <Field
        label={label}
        value={String(form[key] ?? "")}
        onChangeText={(v) => {
          if (key === "passportCountry" || key === "registrationCountry") set(key, v.toUpperCase() as never)
          else if (key === "passportNumber") set(key, v.replace(/\s+/g, "") as never)
          else set(key, v as never)
        }}
        keyboardType={props?.keyboardType}
      />
      {err(key as BitbankerVerificationField) ? (
        <Text className="mt-1 text-sm text-red-600">{err(key as BitbankerVerificationField)}</Text>
      ) : null}
    </View>
  )

  return (
    <View>
      {field(t("verification.bitbanker.passportCountry"), "passportCountry")}
      <Text className="mb-3 text-xs text-muted">{t("verification.bitbanker.passportCountryHint")}</Text>
      {isForeign ? (
        <Text className="mb-3 text-sm text-muted">{t("verification.bitbanker.foreignBranchNote")}</Text>
      ) : null}
      {field(t("verification.bitbanker.firstNameCyrillic"), "firstName")}
      {field(t("verification.bitbanker.lastNameCyrillic"), "lastName")}
      {!isForeign ? field(t("verification.bitbanker.patronymic"), "patronymic") : null}
      {isForeign ? (
        <>
          {field(t("verification.bitbanker.firstNameNative"), "firstNameNative")}
          {field(t("verification.bitbanker.lastNameNative"), "lastNameNative")}
          <Text className="mb-2 font-medium text-gray-900">{t("verification.bitbanker.registrationSection")}</Text>
          {field(t("verification.bitbanker.registrationCountry"), "registrationCountry")}
          {field(t("verification.bitbanker.registrationCity"), "registrationCity")}
          {field(t("verification.bitbanker.registrationStreet"), "registrationStreet")}
          {field(t("verification.bitbanker.registrationHouse"), "registrationHouse")}
          {field(t("verification.bitbanker.registrationIndex"), "registrationIndex")}
        </>
      ) : null}
      {field(t("verification.bitbanker.email"), "email")}
      {field(t("verification.bitbanker.phone"), "phone", { keyboardType: "phone-pad" })}
      <Text className="mb-3 text-xs text-muted">{t("verification.bitbanker.phoneHint")}</Text>
      {field(t("verification.bitbanker.birthDate"), "birthDate")}
      {field(t("verification.bitbanker.passportIssueDate"), "passportIssueDate")}
      <Text className="mb-3 text-xs text-muted">{t("verification.bitbanker.dateHint")}</Text>
      {field(t("verification.bitbanker.passportNumber"), "passportNumber")}
      <Text className="mb-3 text-xs text-muted">{t("verification.bitbanker.passportNumberHint")}</Text>
      <Pressable onPress={() => set("consent", !form.consent)} className="mb-4 flex-row items-start gap-2">
        <View className={`mt-0.5 h-5 w-5 rounded border ${form.consent ? "bg-primary" : "bg-white"}`} />
        <Text className="flex-1 text-sm text-gray-700">{t("verification.bitbanker.consent")}</Text>
      </Pressable>
      {err("consent") ? <Text className="mb-3 text-sm text-red-600">{err("consent")}</Text> : null}
      {formError ? <Text className="mb-3 text-sm text-red-600">{formError}</Text> : null}
      <PrimaryButton
        label={busy ? t("verification.bitbanker.submitting") : t("verification.bitbanker.submit")}
        onPress={() => void submit()}
        busy={busy}
        disabled={!form.consent}
      />
    </View>
  )
}
