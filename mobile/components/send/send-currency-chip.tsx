import { Pressable, StyleSheet, Text, View } from "react-native"
import { ChevronDown } from "lucide-react-native"
import { SvgXml } from "react-native-svg"
import type { CurrencyRow } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

export function SendCurrencyChip({
  code,
  currencies,
  onPress,
  accessibilityLabel,
}: {
  code: string
  currencies: CurrencyRow[]
  onPress: () => void
  accessibilityLabel?: string
}) {
  const row = currencies.find((c) => c.code === code)
  return (
    <Pressable
      onPress={onPress}
      style={styles.chip}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || code}
    >
      {row?.flag_svg ? (
        <View style={styles.flagWrap}>
          <SvgXml xml={row.flag_svg} width={22} height={16} />
        </View>
      ) : (
        <View style={styles.flagPlaceholder} />
      )}
      <Text style={styles.code}>{code}</Text>
      <ChevronDown size={16} color={colors.muted} strokeWidth={2.2} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  flagWrap: { borderRadius: 3, overflow: "hidden" },
  flagPlaceholder: { width: 22, height: 16, borderRadius: 3, backgroundColor: colors.border },
  code: { fontSize: typeSize.body, fontWeight: "700", color: colors.text },
})
