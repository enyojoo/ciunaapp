import { View, Text } from "react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth-context"
import { useBitbankerEligibility } from "@/lib/use-bitbanker-eligibility"
import { PrimaryButton } from "@/components/primary-button"
import { HubLinePageShell } from "@/components/hub-line-page-shell"
import { BitbankerVerificationForm } from "@/components/bitbanker-verification-form"
import { ScreenScroll } from "@/components/screen"

export default function BitbankerVerificationScreen() {
  const router = useRouter()
  const { t } = useTranslation("app")
  const { user, userProfile } = useAuth()
  const { data, mutate } = useBitbankerEligibility(user?.id)

  const verified = data?.isVerifiedForSbp

  return (
    <HubLinePageShell title={t("verification.bitbanker.pageTitle")} backAriaLabel="Back" keyboard>
      <ScreenScroll edges={["left", "right"]}>
        <Text className="mb-4 text-sm text-muted">{t("verification.bitbanker.intro")}</Text>
        {verified ? (
          <View className="py-2">
            <Text className="text-base font-semibold text-gray-900">{t("verification.bitbanker.verifiedTitle")}</Text>
            <View className="mt-4">
              <PrimaryButton label={t("verification.bitbanker.goToSend")} onPress={() => router.replace("/send" as never)} />
            </View>
          </View>
        ) : (
          <View className="py-2">
            <Text className="mb-4 text-sm text-muted">
              {t("verification.bitbanker.statusLabel")}: {data?.status ?? "not_started"}
            </Text>
            <BitbankerVerificationForm
              defaultEmail={userProfile?.email ?? user?.email ?? ""}
              onSubmitted={() => void mutate()}
            />
          </View>
        )}
      </ScreenScroll>
    </HubLinePageShell>
  )
}
