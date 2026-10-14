import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { WebView } from "react-native-webview"
import { ShieldCheck, X } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { ModalToastHost } from "@/components/toast-provider"
import { PrimaryButton } from "@/components/primary-button"
import { openInAppBrowser } from "@/lib/in-app-browser"
import { useWebCenteredModal } from "@/lib/web-centered-modal"
import { colors, radius, type as typeSize } from "@/lib/theme"

/**
 * In-app KYC surface.
 * - Native: full sheet + WebView (top-level document — not an iframe; works with Bitbanker).
 * - Web: Bitbanker sends frame-ancestors 'none' / X-Frame-Options DENY, so we keep Ciuna chrome
 *   and open the partner page in the browser while we poll eligibility.
 */
export function BitbankerKycSheet({
  visible,
  url,
  onClose,
  onRefreshStatus,
  waitingForPartner,
}: {
  visible: boolean
  url: string
  onClose: () => void
  onRefreshStatus: () => void
  /** Show “waiting” copy while we poll Bitbanker eligibility. */
  waitingForPartner?: boolean
}) {
  const { t } = useTranslation("app")
  const dialog = useWebCenteredModal()
  const insets = useSafeAreaInsets()
  const androidTop =
    Platform.OS === "android" ? Math.max(insets.top, StatusBar.currentHeight ?? 0) : 0
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)

  /** Web cannot iframe Bitbanker/Sumsub; native WebView can. */
  const embedInSheet = Platform.OS !== "web"

  useEffect(() => {
    if (visible && url) setLoading(true)
  }, [visible, url])

  useEffect(() => {
    if (!visible || !url || embedInSheet) return
    let cancelled = false
    setOpening(true)
    void openInAppBrowser(url)
      .catch(() => {
        if (typeof window !== "undefined") {
          window.open(url, "_blank", "noopener,noreferrer")
        }
      })
      .finally(() => {
        if (!cancelled) setOpening(false)
      })
    return () => {
      cancelled = true
    }
  }, [visible, url, embedInSheet])

  const openPartner = () => {
    if (!url) return
    setOpening(true)
    void openInAppBrowser(url)
      .catch(() => {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.open(url, "_blank", "noopener,noreferrer")
        }
      })
      .finally(() => setOpening(false))
  }

  const title = t("verification.kycBridge.screenTitle", { defaultValue: "Verify identity" })

  const header = (
    <View style={styles.header}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
        <View style={styles.close}>
          <X size={20} color={colors.text} strokeWidth={2} />
        </View>
      </Pressable>
    </View>
  )

  const body = embedInSheet ? (
    <View style={styles.embedRoot}>
      {loading ? (
        <View style={styles.spinner}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
      {url ? (
        <WebView
          source={{ uri: url }}
          style={styles.webView}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
          allowsInlineMediaPlayback
          mediaCapturePermissionGrantType="grant"
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
      ) : null}
    </View>
  ) : (
    <View style={styles.webFallback}>
      <View style={styles.webIcon}>
        <ShieldCheck size={28} color={colors.primaryDeep} strokeWidth={2.2} />
      </View>
      <Text style={styles.webTitle}>
        {t("verification.kycBridge.inAppSecureTitle", {
          defaultValue: "Continue securely with our partner",
        })}
      </Text>
      <Text style={styles.webBody}>
        {t("verification.kycBridge.inAppSecureBody", {
          defaultValue:
            "For security, Bitbanker opens verification in a protected window. Finish KYC there — this screen stays open and updates when you’re verified.",
        })}
      </Text>
      {waitingForPartner ? (
        <View style={styles.waitingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.waitingText}>
            {t("verification.kycBridge.waitingPartner", {
              defaultValue: "Waiting for verification…",
            })}
          </Text>
        </View>
      ) : null}
      <PrimaryButton
        label={
          opening
            ? t("verification.kycBridge.opening", { defaultValue: "Opening…" })
            : t("verification.kycBridge.openPartner", { defaultValue: "Open verification" })
        }
        onPress={openPartner}
        busy={opening}
      />
      <PrimaryButton
        label={t("verification.kycBridge.refreshAfter", {
          defaultValue: "I’ve finished — check status",
        })}
        variant="ghost"
        onPress={() => {
          onRefreshStatus()
          onClose()
        }}
      />
    </View>
  )

  const content = (
    <>
      {header}
      {body}
      {visible ? <ModalToastHost /> : null}
    </>
  )

  if (dialog) {
    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogPanel, !embedInSheet && styles.dialogPanelCompact]}>{content}</View>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, androidTop > 0 ? { paddingTop: androidTop } : null]}>{content}</View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  dialogOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    padding: 24,
  },
  dialogPanel: {
    width: "100%",
    maxWidth: 880,
    height: "90%",
    maxHeight: 900,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dialogPanelCompact: {
    height: "auto",
    maxHeight: 560,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.paper,
    ...(Platform.OS === "web" ? { height: "100%" as const } : null),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, marginRight: 12, fontSize: typeSize.label, fontWeight: "700", color: colors.text },
  close: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  embedRoot: { flex: 1, minHeight: 0, position: "relative" },
  webView: { flex: 1 },
  spinner: {
    position: "absolute",
    top: "45%",
    left: "50%",
    marginLeft: -20,
    marginTop: -20,
    zIndex: 1,
  },
  webFallback: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 14,
    alignItems: "center",
  },
  webIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroBody,
    marginBottom: 4,
  },
  webTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  webBody: {
    fontSize: typeSize.meta,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 360,
    marginBottom: 4,
  },
  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  waitingText: { fontSize: typeSize.meta, color: colors.muted, fontWeight: "600" },
})
