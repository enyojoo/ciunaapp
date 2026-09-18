import type { TFunction } from "i18next"

/** Bank / account field labels shared by recipients form and send flow (namespace: `app`). */
export function accountFieldLabel(t: TFunction, fieldKey: string, fallback: string): string {
  return t(`recipients.fieldLabels.${fieldKey}`, { defaultValue: fallback })
}

export function accountFieldPlaceholder(t: TFunction, fieldKey: string, fallback: string): string {
  return t(`recipients.fieldPlaceholders.${fieldKey}`, { defaultValue: fallback })
}
