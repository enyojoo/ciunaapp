import { StyleSheet, View } from "react-native"
import { SvgXml } from "react-native-svg"
import { NUCLEO_FLAGS } from "@/lib/nucleo-flags"
import { colors } from "@/lib/theme"

/** Renders a country flag from the nucleo-flags set (https://nucleoapp.com/svg-flag-icons). */
export function FlagIcon({ code, size = 20 }: { code?: string | null; size?: number }) {
  const xml = code ? NUCLEO_FLAGS[code.toUpperCase()] : undefined
  const height = size
  const width = Math.round(size * 1.33)
  if (!xml) return <View style={[styles.placeholder, { width, height, borderRadius: size * 0.15 }]} />
  return (
    <View style={[styles.clip, { width, height, borderRadius: size * 0.15 }]}>
      <SvgXml xml={xml} width={width} height={height} />
    </View>
  )
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  placeholder: { backgroundColor: colors.paper, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
})
