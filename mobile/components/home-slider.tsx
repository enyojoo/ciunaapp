import { useCallback, useEffect, useRef, useState } from "react"
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { ArrowRight } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { HOME_SLIDES, type HomeSlide } from "@/lib/home-slides"
import { TILE_ART, tileArtFor } from "@/components/tile"
import { colors, space } from "@/lib/theme"

const AUTO_MS = 5000
const RESUME_MS = 8000
const HEIGHT = 168
const GAP = 12

/**
 * Home hero as a slider (design-system/components/HomeSlider). Swipe or auto-advance every 5 s; pauses while the
 * user touches it and resumes after 8 s. Slides are data (`lib/home-slides.ts`); ads carry an "Ad" label.
 */
export function HomeSlider({ slides = HOME_SLIDES }: { slides?: HomeSlide[] }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { width } = useWindowDimensions()
  const itemWidth = width - space.page * 2
  const [index, setIndex] = useState(0)
  const listRef = useRef<FlatList<HomeSlide>>(null)
  const pausedUntil = useRef(0)
  const touching = useRef(false)

  const goTo = useCallback(
    (i: number) => {
      listRef.current?.scrollToIndex({ index: i, animated: true })
      setIndex(i)
    },
    [],
  )

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
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled={false}
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
          const art = tileArtFor(item.art)
          const Icon = TILE_ART[item.art]?.icon ?? art.icon
          return (
            <Pressable
              onPress={() => router.push(item.href as never)}
              accessibilityRole="button"
              accessibilityLabel={t(`home.slide.${item.id}.title`, { defaultValue: item.id })}
              style={({ pressed }) => [{ width: itemWidth, height: HEIGHT }, pressed && styles.pressed]}
            >
              <View style={styles.slide}>
                <LinearGradient colors={[art.from, art.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <LinearGradient colors={["rgba(17,24,39,0)", "rgba(17,24,39,0.55)"]} start={{ x: 0, y: 0.3 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                {item.ad ? (
                  <View style={styles.adLabel}>
                    <Text style={styles.adText}>{t("home.slide.adLabel", { defaultValue: "Ad" })}</Text>
                  </View>
                ) : null}
                <View style={styles.iconWell}>
                  <Icon size={34} color="#FFFFFF" strokeWidth={2} />
                </View>
                <View style={styles.text}>
                  <Text style={styles.title} numberOfLines={2}>
                    {t(`home.slide.${item.id}.title`, { defaultValue: item.id })}
                  </Text>
                  <Text style={styles.body} numberOfLines={2}>
                    {t(`home.slide.${item.id}.body`, { defaultValue: "" })}
                  </Text>
                  <View style={styles.cta}>
                    <Text style={styles.ctaText}>{t(`home.slide.${item.id}.cta`, { defaultValue: "Open" })}</Text>
                    <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.4} />
                  </View>
                </View>
              </View>
            </Pressable>
          )
        }}
      />
      {slides.length > 1 ? (
        <View style={styles.dots} accessibilityRole="adjustable" accessibilityLabel={t("home.slide.position", { defaultValue: "Slide {{n}} of {{total}}", n: index + 1, total: slides.length })}>
          {slides.map((s, i) => (
            <Pressable key={s.id} onPress={() => goTo(i)} hitSlop={8} accessibilityLabel={`${i + 1}`}>
              <View style={[styles.dot, i === index && styles.dotOn]} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.page, marginBottom: 14 },
  pressed: { opacity: 0.92 },
  slide: { flex: 1, borderRadius: 20, overflow: "hidden", justifyContent: "flex-end", padding: 18 },
  adLabel: { position: "absolute", left: 14, top: 14, zIndex: 1, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  adText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", color: colors.text },
  iconWell: { position: "absolute", right: 16, top: 16, width: 64, height: 64, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  text: { gap: 4 },
  title: { fontSize: 22, lineHeight: 27, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.2 },
  body: { fontSize: 14, lineHeight: 19, color: "#FFFFFF", opacity: 0.95 },
  cta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  ctaText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotOn: { width: 18, backgroundColor: colors.primary },
})
