import { useCallback, useEffect, useRef } from "react"
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { colors, radius, type as typeSize } from "@/lib/theme"

const LENGTH = 6
const BOX = 48

export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  autoFocus,
  disabled,
}: {
  value: string
  onChange: (digits: string) => void
  onComplete?: (digits: string) => void
  autoFocus?: boolean
  disabled?: boolean
}) {
  const inputRef = useRef<TextInput>(null)
  const digits = value.replace(/\D/g, "").slice(0, LENGTH)
  const active = Math.min(digits.length, LENGTH - 1)

  const apply = useCallback(
    (raw: string) => {
      const next = raw.replace(/\D/g, "").slice(0, LENGTH)
      const wasComplete = value.replace(/\D/g, "").slice(0, LENGTH).length === LENGTH
      onChange(next)
      if (next.length === LENGTH && !wasComplete) onComplete?.(next)
    },
    [onChange, onComplete, value],
  )

  useEffect(() => {
    if (!autoFocus || disabled) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [autoFocus, disabled])

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => inputRef.current?.focus()} disabled={disabled} accessibilityLabel="Verification code">
        <View style={styles.row}>
          {Array.from({ length: LENGTH }, (_, i) => (
            <View key={i} style={[styles.box, active === i && !disabled ? styles.boxActive : null]}>
              <Text style={styles.digit}>{digits[i] ?? ""}</Text>
            </View>
          ))}
        </View>
      </Pressable>
      <TextInput
        ref={inputRef}
        value={digits}
        onChangeText={apply}
        keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        editable={!disabled}
        caretHidden
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.hidden}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  box: {
    flex: 1,
    height: BOX,
    maxWidth: BOX,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  boxActive: { borderColor: colors.primary },
  digit: { fontSize: typeSize.title, fontWeight: "600", color: colors.text },
  hidden: {
    ...StyleSheet.absoluteFill,
    opacity: 0.02,
    color: "transparent",
  },
})
