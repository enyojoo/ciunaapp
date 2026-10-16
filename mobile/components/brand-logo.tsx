import { View } from "react-native"
import { SvgXml } from "react-native-svg"
import { CIUNA_LOGO_SVG } from "./ciuna-logo-svg"

/** Ciuna wordmark, bundled in the app (no network). Keeps the 4217:1167 aspect ratio. */
export function BrandLogo({ height = 28 }: { height?: number }) {
  const width = Math.round(height * (4217 / 1167))
  return (
    <View style={{ height, width }} accessibilityRole="image" accessibilityLabel="Ciuna">
      <SvgXml xml={CIUNA_LOGO_SVG} width={width} height={height} />
    </View>
  )
}
