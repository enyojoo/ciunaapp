type SimpleT = (key: string, options?: Record<string, unknown>) => string

/** Bank / account field labels shared by the recipients form (namespace: `app`). */
export function accountFieldLabel(t: SimpleT, fieldKey: string, fallback: string): string {
  return t(`recipients.fieldLabels.${fieldKey}`, { defaultValue: fallback })
}

export function accountFieldPlaceholder(t: SimpleT, fieldKey: string, fallback: string): string {
  return t(`recipients.fieldPlaceholders.${fieldKey}`, { defaultValue: fallback })
}
