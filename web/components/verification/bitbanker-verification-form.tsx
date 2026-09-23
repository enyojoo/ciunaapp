"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchWithAuth } from "@/lib/fetch-with-auth"
import {
  isRussianPassportCountry,
  validateBitbankerVerificationInput,
  type BitbankerVerificationErrorCode,
  type BitbankerVerificationField,
  type BitbankerVerificationFormInput,
} from "@ciuna/shared"
import { cn } from "@/lib/utils"

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
  const [form, setForm] = useState<BitbankerVerificationFormInput>(() => emptyForm(defaultEmail))

  const isForeign = useMemo(() => !isRussianPassportCountry(form.passportCountry), [form.passportCountry])

  const err = (field: BitbankerVerificationField) => {
    const code = fieldErrors[field]
    return code ? t(`verification.bitbanker.errors.${code}`) : null
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
    try {
      const res = await fetchWithAuth("/api/bitbanker/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          idempotencyKey: `web-verify-${form.email.trim()}-${form.passportNumber.trim().replace(/\s+/g, "")}`,
        }),
      })
      const body = (await res.json().catch(() => ({}))) as {
        error?: string
        fieldErrors?: Partial<Record<BitbankerVerificationField, BitbankerVerificationErrorCode>>
      }
      if (!res.ok) {
        if (body.fieldErrors) setFieldErrors(body.fieldErrors)
        throw new Error(body.error || t("verification.bitbanker.errors.submit_failed"))
      }
      onSubmitted?.()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : t("verification.bitbanker.errors.submit_failed"))
    } finally {
      setBusy(false)
    }
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

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <Label htmlFor="passportCountry">{t("verification.bitbanker.passportCountry")}</Label>
        <Input
          id="passportCountry"
          value={form.passportCountry}
          onChange={(e) => set("passportCountry", e.target.value.toUpperCase())}
          className={cn(err("passportCountry") && "border-red-500")}
          autoComplete="off"
        />
        <p className="mt-1 text-xs text-muted-foreground">{t("verification.bitbanker.passportCountryHint")}</p>
        {err("passportCountry") ? <p className="text-sm text-red-600">{err("passportCountry")}</p> : null}
      </div>

      {isForeign ? (
        <p className="text-sm text-muted-foreground">{t("verification.bitbanker.foreignBranchNote")}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">
            {isForeign ? t("verification.bitbanker.firstNameCyrillic") : t("verification.bitbanker.firstNameCyrillic")}
          </Label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            className={cn(err("firstName") && "border-red-500")}
          />
          {err("firstName") ? <p className="text-sm text-red-600">{err("firstName")}</p> : null}
        </div>
        <div>
          <Label htmlFor="lastName">{t("verification.bitbanker.lastNameCyrillic")}</Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            className={cn(err("lastName") && "border-red-500")}
          />
          {err("lastName") ? <p className="text-sm text-red-600">{err("lastName")}</p> : null}
        </div>
      </div>

      {!isForeign ? (
        <div>
          <Label htmlFor="patronymic">{t("verification.bitbanker.patronymic")}</Label>
          <Input
            id="patronymic"
            value={form.patronymic ?? ""}
            onChange={(e) => set("patronymic", e.target.value)}
            className={cn(err("patronymic") && "border-red-500")}
          />
          {err("patronymic") ? <p className="text-sm text-red-600">{err("patronymic")}</p> : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstNameNative">{t("verification.bitbanker.firstNameNative")}</Label>
              <Input
                id="firstNameNative"
                value={form.firstNameNative ?? ""}
                onChange={(e) => set("firstNameNative", e.target.value)}
                className={cn(err("firstNameNative") && "border-red-500")}
              />
              {err("firstNameNative") ? <p className="text-sm text-red-600">{err("firstNameNative")}</p> : null}
            </div>
            <div>
              <Label htmlFor="lastNameNative">{t("verification.bitbanker.lastNameNative")}</Label>
              <Input
                id="lastNameNative"
                value={form.lastNameNative ?? ""}
                onChange={(e) => set("lastNameNative", e.target.value)}
                className={cn(err("lastNameNative") && "border-red-500")}
              />
              {err("lastNameNative") ? <p className="text-sm text-red-600">{err("lastNameNative")}</p> : null}
            </div>
          </div>
          <p className="text-sm font-medium text-gray-900">{t("verification.bitbanker.registrationSection")}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="registrationCountry">{t("verification.bitbanker.registrationCountry")}</Label>
              <Input
                id="registrationCountry"
                value={form.registrationCountry ?? ""}
                onChange={(e) => set("registrationCountry", e.target.value.toUpperCase())}
                className={cn(err("registrationCountry") && "border-red-500")}
              />
              {err("registrationCountry") ? <p className="text-sm text-red-600">{err("registrationCountry")}</p> : null}
            </div>
            <div>
              <Label htmlFor="registrationCity">{t("verification.bitbanker.registrationCity")}</Label>
              <Input
                id="registrationCity"
                value={form.registrationCity ?? ""}
                onChange={(e) => set("registrationCity", e.target.value)}
                className={cn(err("registrationCity") && "border-red-500")}
              />
              {err("registrationCity") ? <p className="text-sm text-red-600">{err("registrationCity")}</p> : null}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="registrationStreet">{t("verification.bitbanker.registrationStreet")}</Label>
              <Input
                id="registrationStreet"
                value={form.registrationStreet ?? ""}
                onChange={(e) => set("registrationStreet", e.target.value)}
                className={cn(err("registrationStreet") && "border-red-500")}
              />
              {err("registrationStreet") ? <p className="text-sm text-red-600">{err("registrationStreet")}</p> : null}
            </div>
            <div>
              <Label htmlFor="registrationHouse">{t("verification.bitbanker.registrationHouse")}</Label>
              <Input
                id="registrationHouse"
                value={form.registrationHouse ?? ""}
                onChange={(e) => set("registrationHouse", e.target.value)}
                className={cn(err("registrationHouse") && "border-red-500")}
              />
              {err("registrationHouse") ? <p className="text-sm text-red-600">{err("registrationHouse")}</p> : null}
            </div>
          </div>
          <div>
            <Label htmlFor="registrationIndex">{t("verification.bitbanker.registrationIndex")}</Label>
            <Input
              id="registrationIndex"
              value={form.registrationIndex ?? ""}
              onChange={(e) => set("registrationIndex", e.target.value)}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">{t("verification.bitbanker.email")}</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={cn(err("email") && "border-red-500")}
          />
          {err("email") ? <p className="text-sm text-red-600">{err("email")}</p> : null}
        </div>
        <div>
          <Label htmlFor="phone">{t("verification.bitbanker.phone")}</Label>
          <Input
            id="phone"
            value={form.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
            className={cn(err("phone") && "border-red-500")}
            placeholder="+71234567890"
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("verification.bitbanker.phoneHint")}</p>
          {err("phone") ? <p className="text-sm text-red-600">{err("phone")}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="birthDate">{t("verification.bitbanker.birthDate")}</Label>
          <Input
            id="birthDate"
            type="date"
            value={form.birthDate}
            onChange={(e) => set("birthDate", e.target.value)}
            className={cn(err("birthDate") && "border-red-500")}
          />
          {err("birthDate") ? <p className="text-sm text-red-600">{err("birthDate")}</p> : null}
        </div>
        <div>
          <Label htmlFor="passportIssueDate">{t("verification.bitbanker.passportIssueDate")}</Label>
          <Input
            id="passportIssueDate"
            type="date"
            value={form.passportIssueDate}
            onChange={(e) => set("passportIssueDate", e.target.value)}
            className={cn(err("passportIssueDate") && "border-red-500")}
          />
          {err("passportIssueDate") ? <p className="text-sm text-red-600">{err("passportIssueDate")}</p> : null}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("verification.bitbanker.dateHint")}</p>

      <div>
        <Label htmlFor="passportNumber">{t("verification.bitbanker.passportNumber")}</Label>
        <Input
          id="passportNumber"
          value={form.passportNumber}
          onChange={(e) => set("passportNumber", e.target.value.replace(/\s+/g, ""))}
          className={cn(err("passportNumber") && "border-red-500")}
          inputMode="text"
          autoComplete="off"
        />
        <p className="mt-1 text-xs text-muted-foreground">{t("verification.bitbanker.passportNumberHint")}</p>
        {err("passportNumber") ? <p className="text-sm text-red-600">{err("passportNumber")}</p> : null}
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="consent"
          checked={form.consent}
          onCheckedChange={(v) => set("consent", v === true)}
        />
        <Label htmlFor="consent" className="text-sm font-normal leading-snug">
          {t("verification.bitbanker.consent")}
        </Label>
      </div>
      {err("consent") ? <p className="text-sm text-red-600">{err("consent")}</p> : null}
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      <Button type="button" disabled={busy || !form.consent} onClick={() => void submit()}>
        {busy ? t("verification.bitbanker.submitting") : t("verification.bitbanker.submit")}
      </Button>
    </div>
  )
}
