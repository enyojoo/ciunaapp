/** Bitbanker OpenAPI v2 partner-clients field rules (PartnerClientsUpsertRequestV2). */

export type BitbankerVerificationField =
  | "email"
  | "phone"
  | "passportCountry"
  | "firstName"
  | "lastName"
  | "patronymic"
  | "firstNameNative"
  | "lastNameNative"
  | "birthDate"
  | "passportNumber"
  | "passportIssueDate"
  | "registrationCountry"
  | "registrationCity"
  | "registrationStreet"
  | "registrationHouse"
  | "registrationIndex"
  | "consent"

export type BitbankerVerificationErrorCode =
  | "consent_required"
  | "email_required"
  | "email_invalid"
  | "phone_required"
  | "phone_invalid"
  | "passport_country_required"
  | "passport_country_invalid"
  | "first_name_required"
  | "last_name_required"
  | "patronymic_required"
  | "first_name_native_required"
  | "last_name_native_required"
  | "birth_date_required"
  | "birth_date_invalid"
  | "birth_date_future"
  | "passport_issue_date_required"
  | "passport_issue_date_invalid"
  | "passport_issue_date_future"
  | "passport_issue_before_birth"
  | "passport_number_required"
  | "passport_number_invalid"
  | "registration_country_required"
  | "registration_country_invalid"
  | "registration_city_required"
  | "registration_street_required"
  | "registration_house_required"
  | "cyrillic_required"

export type BitbankerVerificationFormInput = {
  email: string
  phone?: string
  passportCountry: string
  firstName: string
  lastName: string
  patronymic?: string
  firstNameNative?: string
  lastNameNative?: string
  birthDate: string
  passportNumber: string
  passportIssueDate: string
  registrationCountry?: string
  registrationCity?: string
  registrationStreet?: string
  registrationHouse?: string
  registrationIndex?: string
  consent: boolean
}

export type BitbankerPartnerClientPayload = {
  client_id: string
  email: string
  phone: string
  country_of_passport_issue: string
  first_name: string
  last_name: string
  birth_date: string
  passport: string
  passport_issue_date: string
  patronymic?: string
  first_name_native?: string
  last_name_native?: string
  registration_country?: string
  registration_city?: string
  registration_street?: string
  registration_house?: string
  registration_index?: string
}

const CYRILLIC = /[\u0400-\u04FF]/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isRussianPassportCountry(code: string): boolean {
  const c = code.trim().toUpperCase()
  return c === "RU" || c === "RUS" || c === "643"
}

/** Accept YYYY-MM-DD (HTML) or DD.MM.YYYY (typed). */
export function parseFlexibleDate(raw: string): Date | null {
  const s = raw.trim()
  if (!s) return null
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const ru = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s)
  if (ru) {
    const d = new Date(Number(ru[3]), Number(ru[2]) - 1, Number(ru[1]))
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export function formatBitbankerDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

export function normalizeBitbankerPhone(raw: string): string | null {
  let s = raw.trim().replace(/[\s()-]/g, "")
  if (!s) return null
  if (s.startsWith("8") && s.length === 11) s = `+7${s.slice(1)}`
  if (/^7\d{10}$/.test(s)) s = `+${s}`
  if (!/^\+7\d{10}$/.test(s)) return null
  return s
}

function startOfToday(): Date {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

export function validateBitbankerVerificationInput(input: BitbankerVerificationFormInput): {
  ok: true
  partner: Omit<BitbankerPartnerClientPayload, "client_id">
  errors?: never
} | {
  ok: false
  errors: Partial<Record<BitbankerVerificationField, BitbankerVerificationErrorCode>>
} {
  const errors: Partial<Record<BitbankerVerificationField, BitbankerVerificationErrorCode>> = {}

  if (!input.consent) errors.consent = "consent_required"

  const email = input.email.trim()
  if (!email) errors.email = "email_required"
  else if (!EMAIL.test(email)) errors.email = "email_invalid"

  const phoneNorm = normalizeBitbankerPhone(input.phone ?? "")
  if (!phoneNorm) {
    errors.phone = input.phone?.trim() ? "phone_invalid" : "phone_required"
  }

  const countryRaw = input.passportCountry.trim()
  if (!countryRaw) errors.passportCountry = "passport_country_required"
  else if (countryRaw.length > 3) {
    errors.passportCountry = "passport_country_invalid"
  }

  const isRu = isRussianPassportCountry(countryRaw || "RU")

  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  if (!firstName) errors.firstName = "first_name_required"
  if (!lastName) errors.lastName = "last_name_required"

  if (isRu) {
    const patronymic = input.patronymic?.trim() ?? ""
    if (!patronymic) errors.patronymic = "patronymic_required"
    if (firstName && !CYRILLIC.test(firstName)) errors.firstName = "cyrillic_required"
    if (lastName && !CYRILLIC.test(lastName)) errors.lastName = "cyrillic_required"
    if (patronymic && !CYRILLIC.test(patronymic)) errors.patronymic = "cyrillic_required"
  } else {
    const fn = input.firstNameNative?.trim() ?? ""
    const ln = input.lastNameNative?.trim() ?? ""
    if (!fn) errors.firstNameNative = "first_name_native_required"
    if (!ln) errors.lastNameNative = "last_name_native_required"

    const regCountry = input.registrationCountry?.trim() ?? ""
    if (!regCountry) errors.registrationCountry = "registration_country_required"
    else if (regCountry.length > 3) errors.registrationCountry = "registration_country_invalid"

    if (!input.registrationCity?.trim()) errors.registrationCity = "registration_city_required"
    if (!input.registrationStreet?.trim()) errors.registrationStreet = "registration_street_required"
    if (!input.registrationHouse?.trim()) errors.registrationHouse = "registration_house_required"
  }

  const birth = parseFlexibleDate(input.birthDate)
  if (!input.birthDate.trim()) errors.birthDate = "birth_date_required"
  else if (!birth) errors.birthDate = "birth_date_invalid"
  else if (birth > startOfToday()) errors.birthDate = "birth_date_future"

  const issue = parseFlexibleDate(input.passportIssueDate)
  if (!input.passportIssueDate.trim()) errors.passportIssueDate = "passport_issue_date_required"
  else if (!issue) errors.passportIssueDate = "passport_issue_date_invalid"
  else if (issue > startOfToday()) errors.passportIssueDate = "passport_issue_date_future"
  else if (birth && issue < birth) errors.passportIssueDate = "passport_issue_before_birth"

  const passport = input.passportNumber.trim().replace(/\s+/g, "")
  if (!passport) errors.passportNumber = "passport_number_required"
  else if (!/^[0-9A-Za-z]{6,20}$/.test(passport)) errors.passportNumber = "passport_number_invalid"

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const countryIssue = isRu ? "RU" : countryRaw.toUpperCase().slice(0, 3)

  const partner: Omit<BitbankerPartnerClientPayload, "client_id"> = {
    email,
    phone: phoneNorm!,
    country_of_passport_issue: countryIssue,
    first_name: firstName,
    last_name: lastName,
    birth_date: formatBitbankerDate(birth!),
    passport,
    passport_issue_date: formatBitbankerDate(issue!),
  }

  if (isRu && input.patronymic?.trim()) partner.patronymic = input.patronymic.trim()
  if (!isRu) {
    partner.first_name_native = input.firstNameNative!.trim()
    partner.last_name_native = input.lastNameNative!.trim()
    partner.registration_country = input.registrationCountry!.trim().toUpperCase().slice(0, 3)
    partner.registration_city = input.registrationCity!.trim()
    partner.registration_street = input.registrationStreet!.trim()
    partner.registration_house = input.registrationHouse!.trim()
    const idx = input.registrationIndex?.trim()
    if (idx) partner.registration_index = idx
  }

  return { ok: true, partner }
}
