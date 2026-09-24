import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { AppState, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useLocalSearchParams, useRouter } from "expo-router"
import { PrimaryButton } from "@/components/primary-button"
import { ExternalLinkModal } from "@/components/external-link-modal"
import { useToast } from "@/components/toast-provider"
import { useAuth } from "@/lib/auth-context"
import { consumeSendReturnPath, setSendReturnPath } from "@/lib/send-return-path"
import { useBitbankerKycBridge } from "@/lib/use-bitbanker-kyc-bridge"
import { colors, type as typeSize } from "@/lib/theme"

const POLL_MS = 8000

export type BitbankerKycBridgeHandle = {
  startVerification: () => Promise<void>
}

type BitbankerKycBridgeProps = {
  /** No inline copy/buttons — only hosted sheet + polling (verification hub). */
  ui?: "full" | "minimal"
  /** Hub: custom primary control; receives label that reflects continue vs start. */
  renderTrigger?: (props: { onPress: () => void; loading: boolean; label: string }) => ReactNode
  /** Dedicated screen: open hosted KYC as soon as session state is loaded. */
  autoOpenVerification?: boolean
  onVerified?: () => void
}

export const BitbankerKycBridge = forwardRef<BitbankerKycBridgeHandle, BitbankerKycBridgeProps>(
  function BitbankerKycBridge(
    { ui = "full", renderTrigger, autoOpenVerification, onVerified },
    ref,
  ) {
    const { t } = useTranslation("app")
    const router = useRouter()
    const params = useLocalSearchParams<{ returnTo?: string }>()
    const { user, profile } = useAuth()
    const email = profile?.email ?? user?.email ?? ""
    const { showError } = useToast()
    const { state, loading, error, refresh, startSession } = useBitbankerKycBridge()
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const autoOpenedRef = useRef(false)
    const lastErrorToastRef = useRef<string | null>(null)
    const [hostedUrl, setHostedUrl] = useState<string | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)

    useEffect(() => {
      if (!error) {
        lastErrorToastRef.current = null
        return
      }
      if (lastErrorToastRef.current === error) return
      lastErrorToastRef.current = error
      showError(error)
    }, [error, showError])

    useEffect(() => {
      if (params.returnTo === "send") {
        void setSendReturnPath("/send")
      }
      void refresh()
    }, [params.returnTo, refresh])

    useEffect(() => {
      const sub = AppState.addEventListener("change", (next) => {
        if (next === "active") {
          void refresh({ poll: true })
        }
      })
      return () => sub.remove()
    }, [refresh])

    const stopPoll = useCallback(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }, [])

    const startPoll = useCallback(() => {
      stopPoll()
      pollRef.current = setInterval(() => {
        void refresh({ poll: true })
      }, POLL_MS)
    }, [refresh, stopPoll])

    const closeSheet = useCallback(() => {
      setSheetOpen(false)
    }, [])

    const openHosted = useCallback(
      async (url: string, paymentUrl: string | null) => {
        if (paymentUrl) {
          await refresh({ poll: true })
          router.replace("/send" as never)
          return
        }
        setHostedUrl(url)
        setSheetOpen(true)
        startPoll()
        void refresh({ poll: true })
      },
      [refresh, router, startPoll],
    )

    const startVerification = useCallback(async () => {
      const session = state?.session
      if (session?.kycUrl && new Date(session.expiresAt).getTime() > Date.now()) {
        await openHosted(session.kycUrl, session.paymentUrl)
        return
      }
      const created = await startSession(email)
      await openHosted(created.kycUrl, created.paymentUrl)
    }, [email, openHosted, startSession, state?.session])

    useImperativeHandle(ref, () => ({ startVerification }), [startVerification])

    useEffect(() => {
      if (state?.eligibility.isVerifiedForSbp) {
        stopPoll()
        setSheetOpen(false)
        setHostedUrl(null)
        onVerified?.()
        void (async () => {
          const returnPath = (await consumeSendReturnPath()) ?? (params.returnTo === "send" ? "/send" : null)
          if (returnPath) {
            router.replace(returnPath as never)
          }
        })()
      }
    }, [state?.eligibility.isVerifiedForSbp, params.returnTo, router, stopPoll, onVerified])

    useEffect(() => () => stopPoll(), [stopPoll])

    useEffect(() => {
      if (!autoOpenVerification || autoOpenedRef.current || loading || state?.eligibility.isVerifiedForSbp) {
        return
      }
      autoOpenedRef.current = true
      void startVerification().catch(() => {
        autoOpenedRef.current = false
      })
    }, [
      autoOpenVerification,
      loading,
      startVerification,
      state?.eligibility.isVerifiedForSbp,
    ])

    const hasActiveSession =
      state?.session?.kycUrl && new Date(state.session.expiresAt).getTime() > Date.now()

    const primaryLabel = hasActiveSession
      ? t("verification.kycBridge.continueCta", { defaultValue: "Continue verification" })
      : t("verification.kycBridge.verifyCta", { defaultValue: "Verify identity" })

    const sheetTitle = t("verification.kycBridge.screenTitle", { defaultValue: "Verify identity" })

    const trigger =
      renderTrigger?.({
        onPress: () => void startVerification(),
        loading,
        label: primaryLabel,
      }) ?? null

    const showInline = ui === "full" && !renderTrigger

    return (
      <>
        {showInline ? (
          <View style={styles.root}>
            <Text style={styles.lead}>
              {t("verification.kycBridge.lead", {
                defaultValue:
                  "Verify with our payment partner (Bitbanker). Russian and foreign passports are supported; routing to IIDX or Sumsub is handled on their secure page—not in Ciuna.",
              })}
            </Text>

            <PrimaryButton label={primaryLabel} onPress={() => void startVerification()} busy={loading} />

            <PrimaryButton
              label={t("verification.bitbanker.refreshStatus", { defaultValue: "Refresh status" })}
              variant="ghost"
              onPress={() => void refresh({ poll: true })}
              disabled={loading}
            />

            {state?.session?.expiresAt ? (
              <Text style={styles.meta}>
                {t("verification.kycBridge.linkExpires", {
                  defaultValue: "Verification link expires at {{time}} (about one hour).",
                  time: new Date(state.session.expiresAt).toLocaleTimeString(),
                })}
              </Text>
            ) : null}

            {state?.eligibility.status === "checking" ? (
              <Text style={styles.meta}>
                {t("verification.kycBridge.reviewPending", {
                  defaultValue:
                    "Verification in progress or under review. We will unlock send when Bitbanker confirms SBP.",
                })}
              </Text>
            ) : null}
          </View>
        ) : (
          trigger
        )}

        <ExternalLinkModal
          visible={sheetOpen && Boolean(hostedUrl)}
          url={hostedUrl ?? ""}
          title={sheetTitle}
          onClose={() => {
            closeSheet()
            void refresh({ poll: true })
          }}
        />
      </>
    )
  },
)

const styles = StyleSheet.create({
  root: { gap: 16 },
  lead: { fontSize: typeSize.body, lineHeight: 22, color: colors.muted },
  meta: { fontSize: typeSize.meta, lineHeight: 20, color: colors.muted },
})
