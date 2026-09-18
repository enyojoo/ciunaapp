import { type ReactElement, type ReactNode } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type RefreshControlProps,
} from "react-native"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { StatusBar } from "expo-status-bar"
import { useRouter } from "expo-router"
import { ArrowLeft, BadgeCheck, ChevronLeft, MapPin } from "lucide-react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, radius, space, type as typeSize } from "@/lib/theme"

const HERO_COLORS = [colors.heroOrange, colors.heroOrangeMid, colors.heroAmber] as const

function goBack(router: ReturnType<typeof useRouter>, backHref: string) {
  if (router.canGoBack()) router.back()
  else router.replace(backHref as never)
}

function HeroBack({ label, onPress }: { label: string; onPress: () => void }) {
  const ios = Platform.OS === "ios"
  const Icon = ios ? ChevronLeft : ArrowLeft
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} style={styles.backHit}>
      <View style={styles.backChip}>
        <Icon size={ios ? 26 : 22} color="#FFFFFF" strokeWidth={ios ? 2.6 : 2.25} />
      </View>
    </Pressable>
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
}) {
  if (heroLoading) {
    return (
      <View style={styles.bar}>
        <View style={styles.backHit} />
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
      <HeroBack label={backAriaLabel} onPress={onBack} />
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
            <BadgeCheck size={18} color="#FFEDD5" strokeWidth={2} accessibilityLabel={verifiedAriaLabel} />
          ) : null}
        </View>
        {loc ? (
          <View style={styles.locRow}>
            <MapPin size={14} color={colors.heroBody} strokeWidth={2} />
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
}) {
  if (heroLoading) {
    return (
      <View style={styles.storefront}>
        <View style={styles.backHit} />
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
      <HeroBack label={backAriaLabel} onPress={onBack} />
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
                <BadgeCheck size={16} color="#FFEDD5" strokeWidth={2.2} accessibilityLabel={verifiedAriaLabel} />
              ) : null}
            </View>
            {loc ? (
              <View style={styles.locCluster}>
                <MapPin size={13} color={colors.heroBody} strokeWidth={2} />
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
}) {
  const router = useRouter()
  const photo = photoUrl?.trim() || ""
  const loc = location?.trim() || ""
  const onBack = () => goBack(router, backHref)
  const storefront = variant === "storefront"

  const hero = (
    <LinearGradient colors={[...HERO_COLORS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <SafeAreaView edges={["top"]}>
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
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  )

  const body = (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.body}>{children}</View>
    </ScrollView>
  )

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {hero}
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
  hero: {
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
    overflow: "hidden",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 8,
    paddingRight: space.page,
    paddingTop: 4,
    paddingBottom: 16,
    minHeight: space.tap,
  },
  backHit: {
    width: space.tap,
    height: space.tap,
    alignItems: "center",
    justifyContent: "center",
  },
  backChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.35,
    lineHeight: 28,
    color: "#FFFFFF",
  },
  subtitle: { marginTop: 4, fontSize: typeSize.meta, lineHeight: 18, color: colors.heroBody },
  locRow: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6 },
  loc: { flex: 1, fontSize: typeSize.meta, lineHeight: 18, color: colors.heroBody },
  photoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  photo: { width: "100%", height: "100%" },
  photoSkeleton: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)" },
  titleSkeleton: { height: 22, width: "70%", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.25)" },
  subSkeleton: { marginTop: 8, height: 12, width: "90%", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.15)" },
  storefront: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: 8,
    paddingRight: space.page,
    paddingTop: 4,
    paddingBottom: 16,
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
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    flexShrink: 0,
  },
  logoSkeleton: { width: 48, height: 48, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)" },
  nameBlock: { flex: 1, minWidth: 0, justifyContent: "center" },
  nameCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
  },
  storeName: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 22,
    color: "#FFFFFF",
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
    fontSize: 12,
    lineHeight: 16,
    color: colors.heroBody,
  },
  storeBio: {
    marginTop: 10,
    fontSize: typeSize.meta,
    lineHeight: 19,
    color: colors.heroBody,
  },
  scroll: { paddingBottom: 40 },
  body: { paddingHorizontal: space.page, paddingTop: 20 },
})
