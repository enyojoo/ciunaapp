import { Pressable, StyleSheet, Text, View } from "react-native"
import { Delete, ScanFace } from "lucide-react-native"
import { colors, radius } from "@/lib/theme"

export const PIN_LEN = 4

const ROWS: (string | "backspace" | null)[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [null, "0", "backspace"],
]

export function PinDots({ digits, length = PIN_LEN, error }: { digits: string; length?: number; error?: boolean }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length }).map((_, i) => {
        const filled = i < digits.length
        const active = i === digits.length
        return (
          <View key={i} style={[styles.dot, (filled || active) && styles.dotActive, error && styles.dotError]}>
            {filled ? <View style={[styles.dotFill, error && styles.dotFillError]} /> : null}
          </View>
        )
      })}
    </View>
  )
}

export function PinKeypad({
  onDigit,
  onBackspace,
  onBiometric,
  disabled,
}: {
  onDigit: (d: string) => void
  onBackspace: () => void
  /** Shows the Face ID or fingerprint key in the empty corner when set. */
  onBiometric?: () => void
  disabled?: boolean
}) {
  return (
    <View style={styles.pad}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={styles.padRow}>
          {row.map((cell, ci) => {
            if (cell === null) {
              return onBiometric ? (
                <View key={`${ri}-${ci}`} style={styles.keyWrap}>
                  <Pressable onPress={onBiometric} disabled={disabled} style={styles.key} accessibilityRole="button" accessibilityLabel="Face ID or fingerprint">
                    <ScanFace size={26} color={colors.primaryText} />
                  </Pressable>
                </View>
              ) : (
                <View key={`${ri}-${ci}`} style={styles.keyWrap} />
              )
            }
            if (cell === "backspace") {
              return (
                <View key={`${ri}-${ci}`} style={styles.keyWrap}>
                  <Pressable onPress={onBackspace} disabled={disabled} style={styles.key} accessibilityRole="button" accessibilityLabel="Delete">
                    <Delete size={22} color={colors.text} />
                  </Pressable>
                </View>
              )
            }
            return (
              <View key={`${ri}-${ci}`} style={styles.keyWrap}>
                <Pressable onPress={() => onDigit(cell)} disabled={disabled} accessibilityRole="button" style={[styles.key, styles.keyFill]}>
                  <Text style={styles.keyText}>{cell}</Text>
                </Pressable>
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  dotError: { borderColor: colors.danger },
  dotFillError: { backgroundColor: colors.danger },
  dots: { marginTop: 40, flexDirection: "row", justifyContent: "center", gap: 12 },
  dot: {
    height: 48,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotActive: { borderColor: colors.primary },
  dotFill: { height: 10, width: 10, borderRadius: 5, backgroundColor: colors.text },
  pad: { marginTop: "auto", width: "100%", maxWidth: 360, alignSelf: "center", gap: 12, paddingBottom: 8, paddingTop: 32 },
  padRow: { flexDirection: "row", gap: 12 },
  keyWrap: { flex: 1, alignItems: "center" },
  key: { height: 72, width: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  keyFill: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  keyText: { fontSize: 24, fontWeight: "600", color: colors.text },
})
