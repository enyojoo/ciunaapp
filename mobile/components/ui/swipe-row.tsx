import { useRef, type ReactNode } from "react"
import { StyleSheet, View } from "react-native"
import ReanimatedSwipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable"
import { AppText } from "@/components/ui/app-text"
import { Icon, type IconName } from "@/components/ui/icon"
import { PressableScale } from "@/components/ui/pressable-scale"
import { haptic } from "@/lib/haptics"
import { colors, space } from "@/lib/theme"

export type SwipeAction = {
  label: string
  icon: IconName
  onPress: () => void
  tone?: "danger" | "neutral"
}

/**
 * Row with actions revealed by swiping left (Delete in Cart, Remove in Favourites and Recipients). The same actions
 * must also be reachable without the gesture (a stepper to 0, a menu), since swipe is invisible to many users.
 */
export function SwipeRow({ children, actions, rounded = 0 }: { children: ReactNode; actions: SwipeAction[]; /** Corner radius of the row, so the revealed actions match its right edge. */ rounded?: number }) {
  const ref = useRef<SwipeableMethods>(null)
  if (actions.length === 0) return <>{children}</>
  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      onSwipeableWillOpen={() => haptic.selection()}
      renderRightActions={() => (
        <View style={[styles.actions, { borderTopRightRadius: rounded, borderBottomRightRadius: rounded }]}>
          {actions.map((a) => (
            <PressableScale
              key={a.label}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              onPress={() => {
                ref.current?.close()
                a.onPress()
              }}
              style={[styles.action, { backgroundColor: a.tone === "neutral" ? colors.neutralText : colors.danger }]}
            >
              <Icon name={a.icon} size={20} color={colors.onPrimary} />
              <AppText variant="caption" tone="onPrimary">
                {a.label}
              </AppText>
            </PressableScale>
          ))}
        </View>
      )}
    >
      {/* A plain View child: gesture-handler is hoisted and types `children` with the root's React 18 ReactNode. */}
      <View>{children}</View>
    </ReanimatedSwipeable>
  )
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", overflow: "hidden" },
  action: { width: 80, alignItems: "center", justifyContent: "center", gap: space.xs },
})
