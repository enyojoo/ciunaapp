import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { colors, radius, space, type as typeSize } from "@/lib/theme"

export function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
  variant = "primary",
}: {
  label: string
  onPress?: () => void
  busy?: boolean
  disabled?: boolean
  variant?: "primary" | "secondary" | "ghost" | "danger"
}) {
  const dimmed = disabled || busy
  return (
    <Pressable onPress={onPress} disabled={dimmed} accessibilityRole="button" accessibilityLabel={label}>
      <View
        style={[
          styles.base,
          variant === "primary" && styles.primary,
          variant === "secondary" && styles.secondary,
          variant === "ghost" && styles.ghost,
          variant === "danger" && styles.ghost,
          dimmed && styles.disabled,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={variant === "primary" ? "#fff" : colors.primary} />
        ) : (
          <Text
            style={[
              styles.label,
              variant === "primary" && styles.labelOnPrimary,
              variant === "danger" && styles.labelDanger,
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: space.tap,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.row,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.45 },
  label: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  labelOnPrimary: { color: "#FFFFFF" },
  labelDanger: { color: colors.danger },
})
