import { type ReactNode } from "react"
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native"
import { colors, radius, space, type as typeSize } from "@/lib/theme"

export function Field({
  label,
  error,
  trailing,
  ...props
}: TextInputProps & { label?: string; error?: string; trailing?: ReactNode }) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.box}>
        <TextInput
          {...props}
          placeholderTextColor="#9CA3AF"
          selectionColor={colors.primary}
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
