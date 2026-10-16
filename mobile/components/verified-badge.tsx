import { BadgeCheck } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { colors } from "@/lib/theme"

/**
 * Compact verified mark shown after a seller or expert name. Success colour with an icon (never
 * colour alone), and a label for screen readers. Unverified people show nothing: don't render it.
 */
export function VerifiedBadge({ size = 14, label, kind = "vendor" }: { size?: number; label?: string; kind?: "vendor" | "expert" }) {
  const { t } = useTranslation("app")
  const text =
    label ||
    (kind === "expert"
      ? t("hub.expertVerified", { defaultValue: "Verified expert" })
      : t("hub.verifiedVendor", { defaultValue: "Verified vendor" }))
  return <BadgeCheck size={size} color={colors.success} strokeWidth={2.2} accessibilityLabel={text} />
}
