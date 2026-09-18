import { Linking, StyleSheet, Text } from "react-native"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { BRAND } from "@ciuna/shared"
import { ui } from "@/lib/theme"

export default function SupportScreen() {
  return (
    <ScreenScroll>
      <Text style={ui.title}>Support</Text>
      <Text style={[ui.subtitle, styles.body]}>We reply at {BRAND.email}.</Text>
      <PrimaryButton label={BRAND.email} onPress={() => void Linking.openURL(`mailto:${BRAND.email}`)} />
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  body: { marginBottom: 24 },
})
