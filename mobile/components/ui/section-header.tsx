import { Pressable, StyleSheet, View } from "react-native"
import { AppText } from "@/components/ui/app-text"
import { haptic } from "@/lib/haptics"
import { space } from "@/lib/theme"

/** Title on the left, optional text action on the right ("See all"). Sits on paper between blocks. */
export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.row}>
      <AppText variant="headline" accessibilityRole="header" style={styles.title} numberOfLines={1}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable
          onPress={() => {
            haptic.selection()
            onAction()
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <AppText variant="label" tone="primary">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md, gap: space.md },
  title: { flexShrink: 1 },
})
