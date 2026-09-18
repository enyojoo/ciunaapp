import { Image } from "expo-image"
import { View } from "react-native"
import { BRAND } from "@ciuna/shared"

const PWA_ICON =
  "https://seeqjiebmrnolcyydewj.supabase.co/storage/v1/object/public/brand/ciuna%20pwa%20icon.png"

export function BrandLogo({ height = 28 }: { height?: number }) {
  const width = Math.round(height * 3.2)
  return (
    <View style={{ height, width }} accessibilityRole="image" accessibilityLabel="Ciuna">
      <Image
        source={{ uri: BRAND.logo }}
        placeholder={{ uri: PWA_ICON }}
        contentFit="contain"
        style={{ height, width }}
        accessibilityLabel="Ciuna"
      />
    </View>
  )
}
