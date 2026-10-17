import { useState } from "react"
import { NARROW_COLUMN } from "@/lib/layout-metrics"
import { StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { useExpertSlots } from "@/lib/use-expert-slots"
import { ScreenScroll } from "@/components/screen"
import { HubTopBar } from "@/components/hub-top-bar"
import { SlotPicker } from "@/components/slot-picker"
import { LoadError } from "@/components/load-error"
import { useToast } from "@/components/toast-provider"
import { StepBar } from "@/components/step-bar"
import { MarketplaceCheckout } from "@/components/marketplace-checkout"
import { colors, type as typeSize } from "@/lib/theme"

function ExpertBookBody() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>(),
    { data, loading, error, revalidate } = useExpertSlots(serviceId),
    [slotId, setSlotId] = useState(""),
    { showError } = useToast(),
    { t } = useTranslation("app")
  if (slotId) {
    return (
      <MarketplaceCheckout
        source={{ kind: "expert", expertServiceSlotId: slotId }}
        onSlotUnavailable={() => {
          setSlotId("")
          void revalidate()
          showError(t("marketplace.errors.SLOT_UNAVAILABLE", { defaultValue: "This appointment is no longer available. Choose another time." }))
        }}
      />
    )
  }
  if (error && !data) {
    return (
      <ScreenScroll contentStyle={NARROW_COLUMN}>
        <LoadError onRetry={() => void revalidate()} />
      </ScreenScroll>
    )
  }
  return (
    <ScreenScroll contentStyle={NARROW_COLUMN}>
      <StepBar steps={[t("marketplace.progressTime", { defaultValue: "Time" }), t("marketplace.progressDetails", { defaultValue: "Details" }), t("marketplace.progressReview", { defaultValue: "Review" })]} active={0} />
      <Text style={styles.title}>{data?.service?.title}</Text>
      {data?.service?.short_description ? <Text style={styles.sub}>{data.service.short_description}</Text> : null}
      <SlotPicker slots={data?.slots || []} loading={loading && !data} onConfirm={setSlotId} expertZone={data?.expertTimeZone} />
    </ScreenScroll>
  )
}

/** Same top bar as the hub screens, titled for the step. */
export default function ExpertBookScreen() {
  const { t } = useTranslation("app")
  return (
    <View style={{ flex: 1 }}>
      <HubTopBar backHref="/experts" title={t("experts.profile.bookSession", { defaultValue: "Book a session" })} />
      <ExpertBookBody />
    </View>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3, color: colors.text, marginBottom: 4 },
  sub: { fontSize: typeSize.body, color: colors.muted, marginBottom: 16 },
})
