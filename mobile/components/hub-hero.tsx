import { StyleSheet, Text } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useTranslation } from "react-i18next"
import { colors, radius, space, type as typeSize } from "@/lib/theme"

/** Web hub orange billboard: title + body on orange → amber. */
export function HubHero() {
  const { t } = useTranslation("app")
  return (
    <LinearGradient
      colors={[colors.heroOrange, colors.heroOrangeMid, colors.heroAmber]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <Text style={styles.title}>
        {t("hub.heroTitle", { defaultValue: "One App, All Your Needs" })}
      </Text>
      <Text style={styles.body}>
        {t("hub.heroBody", {
          defaultValue: "Shop foodstuffs, book services, send money home and handle life abroad on Ciuna.",
        })}
      </Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: space.page,
    marginBottom: 20,
    borderRadius: radius.card,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: typeSize.title,
    fontWeight: "700",
    letterSpacing: -0.4,
    lineHeight: 30,
    color: "#FFFFFF",
  },
  body: {
    marginTop: 8,
    fontSize: typeSize.meta,
    lineHeight: 20,
    color: colors.heroBody,
  },
})
