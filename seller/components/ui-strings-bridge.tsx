"use client"
import * as React from "react"
import { UiStringsProvider } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"

export function UiStringsBridge({ children }: { children: React.ReactNode }) {
  const { t } = useT()
  const value = React.useMemo(() => ({ required: t("state.required"), close: t("action.close"), defaultLabel: t("state.default") }), [t])
  return <UiStringsProvider value={value}>{children}</UiStringsProvider>
}
