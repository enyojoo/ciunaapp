/**
 * Regression checks for Bitbanker verification validation.
 *   cd api && npx tsx scripts/bitbanker-verification-validation-check.ts
 */
import assert from "node:assert/strict"
import {
  isCyrillicPersonName,
  parseFlexibleDate,
  validateBitbankerVerificationInput,
} from "@ciuna/shared"

function baseInput() {
  return {
    email: "test@example.com",
    phone: "+79991234567",
    passportCountry: "RU",
    firstName: "Иван",
    lastName: "Тестов",
    birthDate: "1990-01-15",
    passportNumber: "4010123456",
    passportIssueDate: "2015-06-01",
    consent: true,
  }
}

assert.equal(parseFlexibleDate("31.02.1990"), null, "invalid Feb 31")
assert.equal(parseFlexibleDate("15.01.1990")?.getDate(), 15)

assert.equal(isCyrillicPersonName("Иван"), true)
assert.equal(isCyrillicPersonName("Mary"), false)
assert.equal(isCyrillicPersonName("Иван-Петр"), true)

const ruOk = validateBitbankerVerificationInput({ ...baseInput(), patronymic: "" })
assert.equal(ruOk.ok, true)
if (ruOk.ok) assert.equal(ruOk.partner.patronymic, undefined)

const ruPat = validateBitbankerVerificationInput({ ...baseInput(), patronymic: "Иванович" })
assert.equal(ruPat.ok, true)

const foreignOk = validateBitbankerVerificationInput({
  ...baseInput(),
  passportCountry: "NGA",
  firstName: "Джон",
  lastName: "Смит",
  firstNameNative: "John",
  lastNameNative: "Smith",
  registrationCountry: "RUS",
  registrationCity: "Москва",
  registrationStreet: "Тверская",
  registrationHouse: "1",
})
assert.equal(foreignOk.ok, true)
if (foreignOk.ok) {
  assert.equal(foreignOk.partner.first_name, "Джон")
  assert.equal(foreignOk.partner.first_name_native, "John")
}

const foreignNoCyrillic = validateBitbankerVerificationInput({
  ...baseInput(),
  passportCountry: "NGA",
  firstName: "John",
  lastName: "Smith",
  firstNameNative: "John",
  lastNameNative: "Smith",
  registrationCountry: "RUS",
  registrationCity: "Москва",
  registrationStreet: "Тверская",
  registrationHouse: "1",
})
assert.equal(foreignNoCyrillic.ok, false)

console.log("bitbanker-verification-validation-check: OK")
