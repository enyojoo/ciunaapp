import { useEffect, useRef, useState } from "react"
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { ArrowRight, Globe2, Heart, House, type LucideIcon } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { HOME_SLIDES, type HomeSlide, type HomeSlideTone } from "@/lib/home-slides"
import { colors, space } from "@/lib/theme"

/**
 * Banner gradients. Built from the old hero's warm orange, deepened so white text passes contrast
 * (white on #EA580C is 3.6:1; these stops are 5:1 and up). Each theme has one line of colour for each stop.
 */
const BANNER: Record<HomeSlideTone, { stops: [string, string, string]; icon: LucideIcon }> = {
  warm: { stops: ["#9A3412", "#C2410C", "#D97706"], icon: House },
  teal: { stops: ["#134E4A", "#0F766E", "#115E59"], icon: Globe2 },
  blue: { stops: ["#1E3A8A", "#1D4ED8", "#1E40AF"], icon: Heart },
}

const AUTO_MS = 5000
const RESUME_MS = 8000
const GAP = 12
/** Banner height follows the screen, clamped so small phones keep room for the tiles and large phones do not stretch. */
export function bannerHeight(windowHeight: number): number {
  return Math.min(176, Math.max(104, Math.round(windowHeight * 0.19)))
}

/** Below this the banner drops its small "CIUNA" label and tightens its padding so the text still fits. */
const COMPACT_BANNER = 124

export function HomeSlider({ slides = HOME_SLIDES }: { slides?: HomeSlide[] }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { width, height } = useWindowDimensions()
  // Measured from the container, not the window: on web the content column is narrower than the window.
  const [boxWidth, setBoxWidth] = useState(0)
  const itemWidth = (boxWidth || width) - space.page * 2
  const h = bannerHeight(height)
  const [index, setIndex] = useState(0)
  const listRef = useRef<FlatList<HomeSlide>>(null)
  const pausedUntil = useRef(0)
  const touching = useRef(false)

  useEffect(() => {
    if (slides.length < 2) return
    const timer = setInterval(() => {
      if (touching.current || Date.now() < pausedUntil.current) return
      setIndex((cur) => {
        const next = (cur + 1) % slides.length
        listRef.current?.scrollToIndex({ index: next, animated: true })
        return next
      })
    }, AUTO_MS)
    return () => clearInterval(timer)
  }, [slides.length])

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (itemWidth + GAP))
    setIndex(Math.max(0, Math.min(slides.length - 1, i)))
  }
  const pause = () => {
    touching.current = true
  }
  const resume = () => {
    touching.current = false
    pausedUntil.current = Date.now() + RESUME_MS
  }
  if (slides.length === 0) return null

  return (
    <View style={styles.wrap} onLayout={(e) => setBoxWidth(e.nativeEvent.layout.width)}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth + GAP}
        decelerationRate="fast"
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        onScrollBeginDrag={pause}
        onScrollEndDrag={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({ length: itemWidth + GAP, offset: (itemWidth + GAP) * i, index: i })}
        renderItem={({ item }) => {
          const b = BANNER[item.tone]
          const Icon = b.icon
          const kicker = t(`home.slide.${item.id}.kicker`, { defaultValue: "" })
          return (
            <Pressable
              onPress={() => router.push(item.href as never)}
              accessibilityRole="button"
              accessibilityLabel={t(`home.slide.${item.id}.title`, { defaultValue: item.id })}
              style={({ pressed }) => [{ width: itemWidth, height: h }, pressed && styles.pressed]}
            >
              <View style={[styles.banner, h < COMPACT_BANNER && styles.bannerCompact]}>
                <LinearGradient colors={b.stops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                {/* Decorative: large soft circles tie the banner to the brand's dot mark. */}
                <View style={[styles.orb, styles.orbA]} />
                <View style={[styles.orb, styles.orbB]} />
                {item.ad ? (
                  <View style={styles.adLabel}>
                    <Text style={styles.adText}>{t("home.slide.adLabel", { defaultValue: "Ad" })}</Text>
                  </View>
                ) : null}
                <View style={styles.copy}>
                  {kicker && h >= COMPACT_BANNER ? <Text style={styles.kicker}>{kicker}</Text> : null}
                  <Text style={styles.title} numberOfLines={1}>
                    {t(`home.slide.${item.id}.title`, { defaultValue: item.id })}
                  </Text>
                  <Text style={styles.body} numberOfLines={1}>
                    {t(`home.slide.${item.id}.body`, { defaultValue: "" })}
                  </Text>
                  <View style={styles.cta}>
                    <Text style={styles.ctaText}>{t(`home.slide.${item.id}.cta`, { defaultValue: "Open" })}</Text>
                    <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.4} />
                  </View>
                </View>
                <View style={styles.iconWell}>
                  <Icon size={26} color="#FFFFFF" strokeWidth={2} />
                </View>
              </View>
            </Pressable>
          )
        }}
      />
      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <Pressable
              key={s.id}
              onPress={() => {
                listRef.current?.scrollToIndex({ index: i, animated: true })
                setIndex(i)
              }}
              hitSlop={8}
              accessibilityLabel={t("home.slide.position", { defaultValue: "Slide {{n}} of {{total}}", n: i + 1, total: slides.length })}
            >
              <View style={[styles.dot, i === index && styles.dotOn]} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.page, marginBottom: 12 },
  pressed: { opacity: 0.92 },
  banner: { flex: 1, borderRadius: 20, overflow: "hidden", padding: 18, justifyContent: "flex-end" },
  bannerCompact: { padding: 12 },
  orb: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" },
  orbA: { width: 160, height: 160, right: -48, top: -56 },
  orbB: { width: 90, height: 90, right: 70, bottom: -40, backgroundColor: "rgba(255,255,255,0.08)" },
  adLabel: { position: "absolute", left: 14, top: 14, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  adText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", color: colors.text },
  copy: { gap: 2, paddingRight: 64 },
  kicker: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", color: "rgba(255,255,255,0.85)" },
  title: { fontSize: 19, lineHeight: 24, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.3 },
  body: { fontSize: 13, lineHeight: 18, color: "rgba(255,255,255,0.92)" },
  cta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  ctaText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  iconWell: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotOn: { width: 18, backgroundColor: colors.primary },
})
