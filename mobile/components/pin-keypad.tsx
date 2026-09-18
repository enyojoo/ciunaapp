import { Pressable, StyleSheet, Text, View } from "react-native"
import { Delete } from "lucide-react-native"
import { colors, radius } from "@/lib/theme"

export const PIN_LEN = 4

const ROWS: (string | "backspace" | null)[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [null, "0", "backspace"],
]

export function PinDots({ digits, length = PIN_LEN }: { digits: string; length?: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length }).map((_, i) => {
        const filled = i < digits.length
        const active = i === digits.length
        return (
          <View key={i} style={[styles.dot, (filled || active) && styles.dotActive]}>
            {filled ? <View style={styles.dotFill} /> : null}
          </View>
        )
      })}
    </View>
  )
}

export function PinKeypad({
  onDigit,
  onBackspace,
  disabled,
}: {
  onDigit: (d: string) => void
  onBackspace: () => void
  disabled?: boolean
}) {
  return (
    <View style={styles.pad}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={styles.padRow}>
          {row.map((cell, ci) => {
            if (cell === null) return <View key={`${ri}-${ci}`} style={styles.key} />
            if (cell === "backspace") {
              return (
                <Pressable
                  key={`${ri}-${ci}`}
                  onPress={onBackspace}
                  disabled={disabled}
                  style={styles.key}
                  accessibilityLabel="Delete"
                >
                  <Delete size={22} color={colors.text} />
                </Pressable>
              )
            }
            return (
              <Pressable
                key={`${ri}-${ci}`}
                onPress={() => onDigit(cell)}
                disabled={disabled}
                style={[styles.key, styles.keyFill]}
              >
                <Text style={styles.keyText}>{cell}</Text>
              </Pressable>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
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
  key: { height: 56, flex: 1, alignItems: "center", justifyContent: "center" },
  keyFill: { borderRadius: radius.row, backgroundColor: colors.surface },
  keyText: { fontSize: 24, fontWeight: "600", color: colors.text },
})
