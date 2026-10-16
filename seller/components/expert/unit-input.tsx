"use client"
import * as React from "react"
import { Input, Select } from "@ciuna/ui-web"
import { useT } from "@/lib/i18n"
import { splitMinutes, toMinutes, type DurationUnit } from "./logic"

/** A number in friendly units (minutes or hours). The value is always whole minutes (or null when empty). */
export function UnitInput({ value, onChange, id, invalid, "aria-describedby": describedBy, allowEmpty }: { value: number | null; onChange: (minutes: number | null) => void; id?: string; invalid?: boolean; "aria-describedby"?: string; allowEmpty?: boolean }) {
  const { t } = useT()
  const init = splitMinutes(value ?? 0)
  const [unit, setUnit] = React.useState<DurationUnit>(init.unit)
  const [text, setText] = React.useState(value == null ? "" : String(init.amount))

  const emit = (txt: string, u: DurationUnit) => {
    const n = Number(txt.replace(",", "."))
    if (txt.trim() === "" || !Number.isFinite(n)) return onChange(allowEmpty ? null : 0)
    onChange(toMinutes(n, u))
  }

  return (
    <div className="flex gap-2">
      <Input id={id} aria-invalid={invalid ? true : undefined} aria-describedby={describedBy} inputMode="decimal" value={text} onChange={(e) => { setText(e.target.value); emit(e.target.value, unit) }} className="min-w-0 flex-1" />
      <Select aria-label={t("expert.unit.label")} value={unit} onChange={(e) => { const u = e.target.value as DurationUnit; setUnit(u); emit(text, u) }} className="w-32 shrink-0">
        <option value="minutes">{t("expert.unit.minutes")}</option>
        <option value="hours">{t("expert.unit.hours")}</option>
      </Select>
    </div>
  )
}
