import { Image, StyleSheet, Text, View } from "react-native"
import { colors } from "@/lib/theme"

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}

export function Avatar({ name, size = 56, uri }: { name: string; size?: number; uri?: string | null }) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroBody,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { fontWeight: "700", color: colors.primaryDeep },
})
