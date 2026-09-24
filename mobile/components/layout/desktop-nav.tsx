import { usePathname, useRouter, type Href } from "expo-router"
import { Grip, History, Home } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { SidebarBrandHeader } from "@/components/layout/sidebar-brand-header"
import { useResponsiveLayout } from "@/lib/responsive-layout"
import { colors, shadow } from "@/lib/theme"

const NAV = [
  { id: "home", href: "/hub" as Href, match: ["/hub", "/food", "/mart", "/experts", "/send"] },
  { id: "transactions", href: "/transactions" as Href, match: ["/transactions", "/orders"] },
  { id: "more", href: "/more" as Href, match: ["/more", "/profile", "/verification", "/referrals", "/support", "/recipients"] },
] as const

function pathActive(pathname: string, prefixes: readonly string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function DesktopNav() {
  const { t } = useTranslation("common")
  const pathname = usePathname()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { sidebarWidth } = useResponsiveLayout()

  const items = [
    { ...NAV[0], label: t("nav.home", { defaultValue: "Home" }), icon: Home },
    { ...NAV[1], label: t("nav.transactions", { defaultValue: "Activities" }), icon: History },
    { ...NAV[2], label: t("nav.more", { defaultValue: "More" }), icon: Grip },
  ]

  return (
    <View style={[styles.sidebar, { width: sidebarWidth, paddingBottom: insets.bottom }]}>
      <SidebarBrandHeader />
      <ScrollView
        style={styles.navScroll}
        contentContainerStyle={styles.navScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const active = pathActive(pathname, item.match)
          const Icon = item.icon
          return (
            <Pressable
              key={item.id}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.push(item.href)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Icon size={18} color={active ? colors.primary : colors.muted} strokeWidth={active ? 2.25 : 1.75} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  sidebar: {
    width: 256,
    flexShrink: 0,
    alignSelf: "stretch",
    backgroundColor: colors.surface,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  navScroll: { flex: 1 },
  navScrollContent: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  navItemActive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    ...shadow({ opacity: 0.06, radius: 4, offsetY: 1, elevation: 1 }),
  },
  navLabel: { fontSize: 15, color: colors.muted, fontWeight: "500" },
  navLabelActive: { color: colors.text, fontWeight: "600" },
})
