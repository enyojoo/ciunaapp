import { StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { colors, illustration } from "@/lib/theme"

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}

/** Soft grounds for monograms. The name picks one, so a person keeps the same colour everywhere. */
const MONOGRAM = illustration.monogram

export function monogramColors(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return MONOGRAM[h % MONOGRAM.length]!
}

/** Round photo, or initials on a soft per-name colour when there is none. */
export function Avatar({ name, size = 56, uri }: { name: string; size?: number; uri?: string | null }) {
  const tone = monogramColors(name)
  const round = { width: size, height: size, borderRadius: size / 2 }
  return (
    <View style={[styles.wrap, round, { backgroundColor: uri ? colors.fill : tone.bg }]} accessibilityLabel={name}>
      {uri ? (
        <Image source={{ uri }} style={round} contentFit="cover" transition={150} />
      ) : (
        <Text style={[styles.text, { fontSize: size * 0.38, color: tone.fg }]} maxFontSizeMultiplier={1}>
          {initials(name)}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  text: { fontWeight: "700" },
})
