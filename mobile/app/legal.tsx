import { useTranslation } from "react-i18next"
import { FileText } from "lucide-react-native"
import { ScreenScroll } from "@/components/screen"
import { GroupCard, Row } from "@/components/row"
import { useExternalLink } from "@/lib/external-link"
import { colors } from "@/lib/theme"
import { Text } from "react-native"

/** Legal documents in one place (was two rows on More). Opens the public pages in-app. */
export default function LegalScreen() {
  const { t } = useTranslation("common")
  const { openLink } = useExternalLink()
  return (
    <ScreenScroll>
      <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
        {t("more.legal", { defaultValue: "Legal" })}
      </Text>
      <GroupCard>
        <Row
          icon={<FileText size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("more.privacyPolicy")}
          onPress={() => void openLink("https://www.ciuna.com/privacy", t("more.privacyPolicy"))}
        />
        <Row
          icon={<FileText size={16} color={colors.primaryDeep} strokeWidth={2.2} />}
          label={t("more.termsOfService")}
          onPress={() => void openLink("https://www.ciuna.com/terms", t("more.termsOfService"))}
          last
        />
      </GroupCard>
    </ScreenScroll>
  )
}
