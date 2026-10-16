import { useState } from "react"
import { StyleSheet, Text } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { useExpertSlots } from "@/lib/use-expert-slots"
import { ScreenScroll } from "@/components/screen"
import { SlotPicker } from "@/components/slot-picker"
import { MarketplaceCheckout } from "@/components/marketplace-checkout"
import { colors, type as typeSize } from "@/lib/theme"

export default function ExpertBookScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>(),
    { data, loading } = useExpertSlots(serviceId),
    [slotId, setSlotId] = useState(""),
    { t } = useTranslation("app")
  if (slotId) return <MarketplaceCheckout source={{ kind: "expert", expertServiceSlotId: slotId }} />
  return (
    <ScreenScroll>
      <Text style={styles.title}>{data?.service?.title}</Text>
      {data?.service?.short_description ? <Text style={styles.sub}>{data.service.short_description}</Text> : null}
      <SlotPicker slots={data?.slots || []} loading={loading && !data} onConfirm={setSlotId} />
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3, color: colors.text, marginBottom: 4 },
  sub: { fontSize: typeSize.body, color: colors.muted, marginBottom: 16 },
})
