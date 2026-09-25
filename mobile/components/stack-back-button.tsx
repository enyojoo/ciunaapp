import { Platform, Pressable, StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import { ArrowLeft, ChevronLeft } from "lucide-react-native"
import { colors, space } from "@/lib/theme"

/** Consistent stack back control for native + Expo web (web often hides the default). */
export function StackBackButton({
  fallbackHref,
  label = "Back",
}: {
  fallbackHref?: string
  label?: string
}) {
  const router = useRouter()
  const ios = Platform.OS === "ios"
  const Icon = ios ? ChevronLeft : ArrowLeft
  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) router.back()
        else if (fallbackHref) router.replace(fallbackHref as never)
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      style={styles.hit}
    >
      <View style={styles.chip}>
        <Icon size={ios ? 28 : 22} color={colors.text} strokeWidth={ios ? 2.6 : 2.25} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  hit: {
    minWidth: space.tap,
    minHeight: space.tap,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Platform.OS === "web" ? 4 : 0,
  },
  chip: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
})
