import { type ReactNode } from "react"
import { StyleSheet, Text, View, type TextInputProps } from "react-native"
import { AppTextInput } from "@/components/app-text-input"
import { useInputFocusRing } from "@/lib/focused-input-box"
import { colors, radius, space, type as typeSize } from "@/lib/theme"

export function Field({
  label,
  error,
  trailing,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { label?: string; error?: string; trailing?: ReactNode }) {
  const { onFocus: ringFocus, onBlur: ringBlur, boxStyle } = useInputFocusRing()

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.box, boxStyle]}>
        <AppTextInput
          {...props}
          onFocus={(e) => {
            ringFocus()
            onFocus?.(e)
          }}
          onBlur={(e) => {
            ringBlur()
            onBlur?.(e)
          }}
          placeholderTextColor="#9CA3AF"
          style={[styles.input, props.style]}
        />
        {trailing}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { marginBottom: 8, fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  box: {
    minHeight: space.tap,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    minHeight: space.tap,
    paddingVertical: 12,
    fontSize: typeSize.body,
    color: colors.text,
  },
  error: { marginTop: 6, fontSize: typeSize.meta, color: colors.danger },
})
