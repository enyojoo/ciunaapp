import type { BitbankerVerificationFormInput } from "@ciuna/shared"

/** Stored for office compliance; excludes consent flag only. */
export function buildBitbankerFormSnapshot(input: BitbankerVerificationFormInput): Record<string, string> {
  const snap: Record<string, string> = {
    email: input.email.trim(),
    phone: (input.phone ?? "").trim(),
    passportCountry: input.passportCountry.trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    birthDate: input.birthDate.trim(),
    passportNumber: input.passportNumber.trim().replace(/\s+/g, ""),
    passportIssueDate: input.passportIssueDate.trim(),
  }
  const patronymic = input.patronymic?.trim()
  if (patronymic) snap.patronymic = patronymic
  const fn = input.firstNameNative?.trim()
  if (fn) snap.firstNameNative = fn
  const ln = input.lastNameNative?.trim()
  if (ln) snap.lastNameNative = ln
  const regCountry = input.registrationCountry?.trim()
  if (regCountry) snap.registrationCountry = regCountry
  const city = input.registrationCity?.trim()
  if (city) snap.registrationCity = city
  const street = input.registrationStreet?.trim()
  if (street) snap.registrationStreet = street
  const house = input.registrationHouse?.trim()
  if (house) snap.registrationHouse = house
  const index = input.registrationIndex?.trim()
  if (index) snap.registrationIndex = index
  return snap
}
