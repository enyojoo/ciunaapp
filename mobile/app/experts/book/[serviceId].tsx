import { useState } from "react"
import { Pressable, Text } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { useExpertSlots } from "@/lib/use-expert-slots"
import { ScreenScroll } from "@/components/screen"
import { MarketplaceCheckout } from "@/components/marketplace-checkout"
export default function ExpertBookScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>(),
    { data, loading } = useExpertSlots(serviceId),
    [slotId, setSlotId] = useState(""),
    { t } = useTranslation("app")
  if (slotId) return <MarketplaceCheckout source={{ kind: "expert", expertServiceSlotId: slotId }} />
  return (
    <ScreenScroll>
      <Text className="mb-4 text-2xl font-semibold">{data?.service?.title}</Text>
      {loading ? (
        <Text>{t("marketplace.loading")}</Text>
      ) : !data?.slots.length ? (
        <Text>{t("marketplace.noSlots")}</Text>
      ) : (
        data.slots.map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            onPress={() => setSlotId(s.id)}
            className="mb-3 min-h-[48px] rounded-xl border border-border p-4"
          >
            <Text>{new Date(s.slot_start).toLocaleString()}</Text>
          </Pressable>
        ))
      )}
    </ScreenScroll>
  )
}
