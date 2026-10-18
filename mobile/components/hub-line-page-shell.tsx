import { useState, type ReactElement, type ReactNode } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type RefreshControlProps,
} from "react-native"
import { Image } from "expo-image"
import { StatusBar } from "expo-status-bar"
import { useRouter } from "expo-router"
import { MapPin } from "lucide-react-native"
import { Icon } from "@/components/ui/icon"
import { NavBar } from "@/components/ui/nav-bar"
import { PressableScale } from "@/components/ui/pressable-scale"
import { VerifiedBadge } from "@/components/verified-badge"
import { CommunityPill } from "@/components/community-picker"
import { LocationPill } from "@/components/location-picker"
import { SearchHeroButton } from "@/components/search-entry"
import { colors, radius, space, type as typeSize } from "@/lib/theme"


export function goBack(router: ReturnType<typeof useRouter>, backHref: string) {
  if (router.canGoBack()) router.back()
  else router.replace(backHref as never)
}

/** Plain back chevron, the same control as `NavBar` (no ring, no chip). */
export function HeroBack({ label, onPress }: { label: string; onPress: () => void }) {
  const ios = Platform.OS === "ios"
  return (
    <PressableScale onPress={onPress} scaleTo={0.9} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} style={styles.backHit}>
      <Icon name="back" size={ios ? 22 : 24} color={colors.text} strokeWidth={2.2} />
    </PressableScale>
  )
}

function LineHero({
  title,
  subtitle,
  photo,
  loc,
  verified,
  verifiedAriaLabel,
  heroLoading,
  backAriaLabel,
  onBack,
  trailingAction,
}: {
  title: string
  subtitle?: string | null
  photo: string
  loc: string
  verified?: boolean
  verifiedAriaLabel?: string
  heroLoading?: boolean
  backAriaLabel: string
  onBack: () => void
  trailingAction?: ReactNode
}) {
  if (heroLoading) {
    return (
      <View style={styles.bar}>
        {photo ? <View style={styles.photoSkeleton} /> : null}
        <View style={styles.copy}>
          <View style={styles.titleSkeleton} />
          <View style={styles.subSkeleton} />
        </View>
      </View>
    )
  }
  return (
    <View style={styles.bar}>
      {photo ? (
        <View style={styles.photoWrap}>
          <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
        </View>
      ) : null}
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {verified ? (
            <VerifiedBadge size={18} label={verifiedAriaLabel} />
          ) : null}
        </View>
        {loc ? (
          <View style={styles.locRow}>
            <MapPin size={14} color={colors.muted} strokeWidth={2} />
            <Text style={styles.loc} numberOfLines={1}>
              {loc}
            </Text>
          </View>
        ) : null}
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

/** Storefront: back · logo · name ✓ over location; bio under logo + name. */
function StorefrontHero({
  title,
  subtitle,
  photo,
  loc,
  verified,
  verifiedAriaLabel,
  heroLoading,
  backAriaLabel,
  onBack,
  trailingAction,
}: {
  title: string
  subtitle?: string | null
  photo: string
  loc: string
  verified?: boolean
  verifiedAriaLabel?: string
  heroLoading?: boolean
  backAriaLabel: string
  onBack: () => void
  trailingAction?: ReactNode
}) {
  if (heroLoading) {
    return (
      <View style={styles.storefront}>
        <View style={styles.storefrontMain}>
          <View style={styles.identityRow}>
            <View style={styles.logoSkeleton} />
            <View style={styles.nameBlock}>
              <View style={styles.titleSkeleton} />
              <View style={styles.subSkeleton} />
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.storefront}>
      <View style={styles.storefrontMain}>
        <View style={styles.identityRow}>
          <View style={styles.logoWrap}>
            {photo ? <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" /> : null}
          </View>
          <View style={styles.nameBlock}>
            <View style={styles.nameCluster}>
              <Text style={styles.storeName} numberOfLines={1}>
                {title}
              </Text>
              {verified ? (
                <VerifiedBadge size={16} label={verifiedAriaLabel} />
              ) : null}
            </View>
            {loc ? (
              <View style={styles.locCluster}>
                <MapPin size={13} color={colors.muted} strokeWidth={2} />
                <Text style={styles.storeLoc} numberOfLines={1}>
                  {loc}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        {subtitle ? (
          <Text style={styles.storeBio} numberOfLines={4}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

/**
 * Orange header is the nav: back lives in the gradient, left of the title.
 * Hero stays pinned so the control does not scroll away.
 */
export function HubLinePageShell({
  title,
  subtitle,
  children,
  backHref = "/(app)/hub",
  backAriaLabel,
  photoUrl,
  location,
  verified,
  verifiedAriaLabel,
  heroLoading,
  refreshControl,
  keyboard,
  variant = "line",
  trailingAction: trailingProp,
  searchLine,
  locationPicker,
  communityPicker,
}: {
  title: string
  subtitle?: string | null
  children: ReactNode
  backHref?: string
  backAriaLabel: string
  photoUrl?: string | null
  location?: string | null
  verified?: boolean
  verifiedAriaLabel?: string
  heroLoading?: boolean
  refreshControl?: ReactElement<RefreshControlProps>
  keyboard?: boolean
  variant?: "line" | "storefront"
  /** Optional extra control in the hero row (e.g. a cart icon on Food/Mart). */
  trailingAction?: ReactNode
  /** Adds a search button to the hero that opens Search scoped to this line. */
  searchLine?: "food" | "mart" | "experts"
  /** Shows the location pill in the bar, before the other actions (Food, Mart and Experts homes). */
  locationPicker?: boolean
  /** Shows the community filter before the location pill (Food and Mart homes). */
  communityPicker?: boolean
}) {
  const router = useRouter()
  const trailingAction =
    searchLine || trailingProp || locationPicker || communityPicker ? (
      <View style={styles.trailing}>
        {communityPicker ? <CommunityPill /> : null}
        {locationPicker ? <LocationPill /> : null}
        {searchLine ? <SearchHeroButton line={searchLine} /> : null}
        {trailingProp}
      </View>
    ) : undefined
  const photo = photoUrl?.trim() || ""
  const loc = location?.trim() || ""
  const onBack = () => goBack(router, backHref)
  const storefront = variant === "storefront"
  const [scrolled, setScrolled] = useState(false)

  // Only the bar is pinned; the large title scrolls away with the content, as on a native large-title screen.
  const bar = (
    <View style={styles.hero}>
      {/* The same 44 pt bar as store, product, cart and checkout, so back and the cart never move between screens. */}
      <NavBar onBack={onBack} backLabel={backAriaLabel} trailing={trailingAction} hairline={scrolled} />
    </View>
  )
  const hero = (
      <View>
        {storefront ? (
          <StorefrontHero
            title={title}
            subtitle={subtitle}
            photo={photo}
            loc={loc}
            verified={verified}
            verifiedAriaLabel={verifiedAriaLabel}
            heroLoading={heroLoading}
            backAriaLabel={backAriaLabel}
            onBack={onBack}
            trailingAction={trailingAction}
          />
        ) : (
          <LineHero
            title={title}
            subtitle={subtitle}
            photo={photo}
            loc={loc}
            verified={verified}
            verifiedAriaLabel={verifiedAriaLabel}
            heroLoading={heroLoading}
            backAriaLabel={backAriaLabel}
            onBack={onBack}
            trailingAction={trailingAction}
          />
        )}
      </View>
  )

  const body = (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={32}
      onScroll={(e) => {
        const past = e.nativeEvent.contentOffset.y > 40
        if (past !== scrolled) setScrolled(past)
      }}
    >
      {hero}
      <View style={styles.body}>{children}</View>
    </ScrollView>
  )

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      {bar}
      {keyboard ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  flex: { flex: 1 },
  // Same canvas as the page, no hairline: the header reads as part of the screen, like a native nav bar.
  hero: {
    backgroundColor: colors.paper,
    overflow: "hidden",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: space.page,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backHit: {
    width: space.tap,
    height: space.tap,
    alignItems: "center",
    justifyContent: "center",
  },
  trailing: { flexDirection: "row", alignItems: "center", flexShrink: 1, minWidth: 0 },
  copy: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: {
    flex: 1,
    fontSize: typeSize.largeTitle,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 36,
    color: colors.text,
  },
  subtitle: { marginTop: 4, fontSize: typeSize.meta, lineHeight: 18, color: colors.muted },
  locRow: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6 },
  loc: { flex: 1, fontSize: typeSize.meta, lineHeight: 18, color: colors.muted },
  photoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: { width: "100%", height: "100%" },
  photoSkeleton: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.neutralSurface },
  titleSkeleton: { height: 22, width: "70%", borderRadius: 6, backgroundColor: colors.neutralSurface },
  subSkeleton: { marginTop: 8, height: 12, width: "90%", borderRadius: 6, backgroundColor: colors.surface },
  storefront: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: space.page,
    paddingTop: 4,
    paddingBottom: 12,
  },
  storefrontMain: { flex: 1, minWidth: 0, paddingTop: 4 },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  logoSkeleton: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.neutralSurface },
  nameBlock: { flex: 1, minWidth: 0, justifyContent: "center" },
  nameCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
  },
  storeName: {
    flexShrink: 1,
    fontSize: typeSize.headline,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 22,
    color: colors.text,
  },
  locCluster: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },
  storeLoc: {
    flexShrink: 1,
    fontSize: typeSize.caption,
    lineHeight: 16,
    color: colors.muted,
  },
  storeBio: {
    marginTop: 10,
    fontSize: typeSize.meta,
    lineHeight: 19,
    color: colors.muted,
  },
  // A little extra clearance vs. a plain screen's 40 — Food/Mart screens under this shell can also
  // show the floating cart bar, and last-row content ending up pressed against it looks cramped.
  // Kept modest (not a big empty void), and harmless for lines that never show that bar.
  scroll: { paddingBottom: 120 },
  body: { paddingHorizontal: space.page, paddingTop: 12 },
})

/** The Food and Mart header bar's own styles, shared so other hub screens use the identical bar. */
export const heroBarStyle = { hero: styles.hero, bar: styles.bar, trailing: styles.trailing }
