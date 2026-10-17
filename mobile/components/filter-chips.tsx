import { ChipRow, type ChipOption } from "@/components/ui/chip"

export type FilterChipOption<T extends string> = ChipOption<T>

/**
 * One horizontal row of single-choice chips. The selected chip is the only filled one (ink
 * fill, white label). Use it for categories, result groups and any other short filter list.
 */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: FilterChipOption<T>[]
  value: T
  onChange: (id: T) => void
  ariaLabel?: string
}) {
  return <ChipRow options={options} value={value} onChange={onChange} inset={0} accessibilityLabel={ariaLabel} />
}
