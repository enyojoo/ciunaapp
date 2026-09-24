import { StyleSheet, View } from "react-native"
import { SvgXml } from "react-native-svg"
import { FlagIcon } from "@/components/flag-icon"
import { flagCountryForCurrency } from "@/lib/currency-flag-country"
import { NUCLEO_FLAGS } from "@/lib/nucleo-flags"
import { colors } from "@/lib/theme"

/** Consistent currency flag (nucleo when mapped, else API `flag_svg` in a clipped slot). */
export function CurrencyFlag({
  code,
  flagSvg,
  size = 20,
}: {
  code: string
  flagSvg?: string | null
  size?: number
}) {
  const country = flagCountryForCurrency(code)
  if (country && NUCLEO_FLAGS[country]) {
    return <FlagIcon code={country} size={size} />
  }
  if (flagSvg?.trim()) {
    const height = size
    const width = Math.round(size * 1.33)
    return (
      <View style={[styles.clip, { width, height, borderRadius: size * 0.15 }]}>
        <SvgXml xml={flagSvg} width={width} height={height} />
      </View>
    )
  }
  const height = size
  const width = Math.round(size * 1.33)
  return <View style={[styles.placeholder, { width, height, borderRadius: size * 0.15 }]} />
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  placeholder: {
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
})
