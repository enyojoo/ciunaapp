import { StyleSheet } from "react-native"
import { useOptionalResponsiveLayout } from "@/lib/responsive-layout"
import { colors, radius, shadow } from "@/lib/theme"

/** Centered dialog on Expo web tablet/desktop (≥600px, sidebar shell). Native + phone web keep sheets. */
export function useWebCenteredModal(): boolean {
  const layout = useOptionalResponsiveLayout()
  return layout?.showSidebarShell ?? false
}

export const webCenteredModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    padding: 24,
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "88%",
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    overflow: "hidden",
    ...shadow({ opacity: 0.16, radius: 24, offsetY: 12, elevation: 12 }),
  },
  panelWide: {
    maxWidth: 880,
    maxHeight: "86%",
    height: "86%",
  },
})
