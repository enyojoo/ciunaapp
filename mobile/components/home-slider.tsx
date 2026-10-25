import { useEffect, useRef, useState, type ReactNode } from "react"
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { FlagIcon } from "@/components/flag-icon"
import { Icon } from "@/components/ui/icon"
import { PressableScale } from "@/components/ui/pressable-scale"
import type { HomeSlide, HomeSlideId } from "@/lib/home-slides"
import { colors, illustration, radius, space, type as typeSize } from "@/lib/theme"

/** One flat colour per slide. White text on each is 6:1 or better. */
const BG: Record<HomeSlideId, string> = illustration.slide

const AUTO_MS = 6000
const RESUME_MS = 8000

/** Hero height follows the screen, clamped so small phones keep room for the tiles. */
export function bannerHeight(windowHeight: number): number {
  return Math.min(152, Math.max(124, Math.round(windowHeight * 0.16)))
}

/** The small picture on the right of each slide: one quiet sign of the idea, not decoration. */
function Motif({ id }: { id: HomeSlideId }): ReactNode {
  switch (id) {
    case "sorted":
      // The Ciuna mark: four dots, one lit.
      return (
        <View style={styles.mark}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.markDot, i === 0 && styles.markDotOn]} />
          ))}
        </View>
      )
    case "community":
      return (
        <View style={styles.people}>
          {illustration.people.map((c, i) => (
            <View key={c} style={[styles.person, { backgroundColor: c, marginLeft: i === 0 ? 0 : -12 }]}>
              <Icon name="account" size={18} color={illustration.ink} filled />
            </View>
          ))}
        </View>
      )
    case "language":
      // One flag chip per app language (same flags as the language picker).
      return (
        <View style={styles.methods}>
          {["GB", "RU", "FR", "ES", "CN", "BR"].map((c) => (
            <View key={c} style={styles.method}>
              <FlagIcon code={c} size={16} />
            </View>
          ))}
        </View>
      )
  }
}

export function HomeSlider({ slides }: { slides: HomeSlide[] }) {
  const { t } = useTranslation("app")
  const router = useRouter()
  const { width, height } = useWindowDimensions()
  // The page is the frame's own width, so each swipe or auto-advance lands one whole slide in view.
  const [frameWidth, setFrameWidth] = useState(0)
  const page = frameWidth || width - space.page * 2
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
        listRef.current?.scrollToOffset({ offset: next * page, animated: true })
        return next
      })
    }, AUTO_MS)
    return () => clearInterval(timer)
  }, [slides.length, page])

  useEffect(() => {
    if (index >= slides.length) setIndex(0)
  }, [index, slides.length])

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / page)
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
      <View style={[styles.frame, { height: h }]} onLayout={(e) => setFrameWidth(Math.round(e.nativeEvent.layout.width))}>
        {frameWidth > 0 ? (
          <FlatList
            ref={listRef}
            data={slides}
            keyExtractor={(s) => s.id}
            horizontal
            pagingEnabled
            disableIntervalMomentum
            decelerationRate="fast"
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={pause}
            onScrollEndDrag={resume}
            onMomentumScrollEnd={onMomentumEnd}
            getItemLayout={(_, i) => ({ length: page, offset: page * i, index: i })}
            renderItem={({ item }) => {
              const title = t(`home.slide.${item.id}.title`)
              const body = t(`home.slide.${item.id}.body`)
              const href = item.href
              return (
                <PressableScale
                  onPress={href ? () => router.push(href as never) : undefined}
                  disabled={!href}
                  scaleTo={href ? 0.985 : 1}
                  accessibilityRole={href ? "button" : "text"}
                  accessibilityLabel={`${title}. ${body}`}
                  style={[styles.slide, { width: page, height: h, backgroundColor: BG[item.id] }]}
                >
                  <View style={styles.top}>
                    <View style={styles.copy}>
                      <Text style={styles.title} numberOfLines={2}>
                        {title}
                      </Text>
                      <Text style={styles.body} numberOfLines={2}>
                        {body}
                      </Text>
                    </View>
                    <View style={styles.motif}>
                      <Motif id={item.id} />
                    </View>
                  </View>
                  {item.ad ? (
                    <View style={styles.adLabel}>
                      <Text style={styles.adText}>{t("home.slide.adLabel", { defaultValue: "Ad" })}</Text>
                    </View>
                  ) : null}
                </PressableScale>
              )
            }}
          />
        ) : null}
      </View>
      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <Pressable
              key={s.id}
              onPress={() => {
                listRef.current?.scrollToOffset({ offset: i * page, animated: true })
                setIndex(i)
                pausedUntil.current = Date.now() + RESUME_MS
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
  frame: { borderRadius: radius.hero, overflow: "hidden", backgroundColor: colors.fill },
  // Words sit at the bottom-left, the motif top-right: a calm, poster-like slide.
  slide: { padding: 18, justifyContent: "flex-end" },
  top: { flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 12 },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: typeSize.title, lineHeight: 27, fontWeight: "700", color: colors.onPrimary, letterSpacing: -0.4 },
  body: { fontSize: typeSize.meta, lineHeight: 19, color: "rgba(255,255,255,0.82)" },
  motif: { position: "absolute", top: 0, right: 0 },
  adLabel: { position: "absolute", right: 14, bottom: 14, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  adText: { fontSize: typeSize.caption, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", color: colors.text },
  mark: { width: 34, flexDirection: "row", flexWrap: "wrap", gap: 4 },
  markDot: { width: 15, height: 15, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.22)" },
  markDotOn: { backgroundColor: illustration.accent },
  people: { flexDirection: "row", alignItems: "center" },
  person: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: illustration.slide.community },
  methods: { flexDirection: "row", gap: 5 },
  method: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.16)" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotOn: { width: 18, backgroundColor: colors.text },
})
