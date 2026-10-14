import { createElement, useEffect, useState, type ReactNode } from "react"
import { ActivityIndicator, Modal, Platform, Pressable, StatusBar, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { WebView } from "react-native-webview"
import { ExternalLink, X } from "lucide-react-native"
import { ModalToastHost } from "@/components/toast-provider"
import { PrimaryButton } from "@/components/primary-button"
import { openInAppBrowser } from "@/lib/in-app-browser"
import { useWebCenteredModal } from "@/lib/web-centered-modal"
import { colors, radius, type as typeSize } from "@/lib/theme"

/** Hosts that send `frame-ancestors 'none'` (or equivalent) and cannot be iframed. */
function hostBlocksFraming(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return (
      host.includes("bitbanker.") ||
      host.endsWith("bitbanker.ru") ||
      host.includes("sumsub.") ||
      host.includes("sns-host")
    )
  } catch {
    return false
  }
}

export function ExternalLinkModal({
  visible,
  url,
  title,
  onClose,
  /**
   * `embed` = iframe (web) / WebView (native).
   * `external` = keep Ciuna sheet; open URL in system/in-app browser (required when CSP blocks framing).
   * `auto` = external on web for known non-frameable hosts; embed otherwise.
   */
  presentation = "auto",
}: {
  visible: boolean
  url: string
  title?: string
  onClose: () => void
  presentation?: "auto" | "embed" | "external"
}) {
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)
  const dialog = useWebCenteredModal()
  const insets = useSafeAreaInsets()
  const androidTop =
    Platform.OS === "android" ? Math.max(insets.top, StatusBar.currentHeight ?? 0) : 0

  const useExternal =
    presentation === "external" ||
    (presentation === "auto" && Platform.OS === "web" && Boolean(url) && hostBlocksFraming(url))

  useEffect(() => {
    if (visible && url) setLoading(true)
  }, [visible, url])

  useEffect(() => {
    if (!visible || !url || !useExternal) return
    let cancelled = false
    setOpening(true)
    void openInAppBrowser(url)
      .catch(() => {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.open(url, "_blank", "noopener,noreferrer")
        }
      })
      .finally(() => {
        if (!cancelled) {
          setOpening(false)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [visible, url, useExternal])

  const reopen = () => {
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

  const body: ReactNode = (
    <>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title || ""}
        </Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
          <View style={styles.close}>
            <X size={20} color={colors.text} strokeWidth={2} />
          </View>
        </Pressable>
      </View>

      {useExternal ? (
        <View style={styles.externalBody}>
          <View style={styles.externalIcon}>
            <ExternalLink size={28} color={colors.primaryDeep} strokeWidth={2} />
          </View>
          <Text style={styles.externalTitle}>
            Complete verification with our partner
          </Text>
          <Text style={styles.externalBodyText}>
            Their secure page cannot open inside this window. We opened it in your browser — finish
            KYC there, then return here. We’ll update your status automatically.
          </Text>
          <PrimaryButton
            label={opening ? "Opening…" : "Open verification again"}
            onPress={reopen}
            busy={opening}
          />
          <PrimaryButton label="I’ve finished — refresh" variant="ghost" onPress={onClose} />
        </View>
      ) : (
        <>
          {loading ? (
            <View style={styles.spinner}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : null}
          {url ? (
            Platform.OS === "web" ? (
              createElement("iframe", {
                src: url,
                title: title || "Ciuna",
                allow: "camera; microphone; clipboard-write",
                referrerPolicy: "strict-origin-when-cross-origin",
                style: {
                  flex: 1,
                  width: "100%",
                  height: "100%",
                  border: "none",
                  minHeight: 0,
                  background: colors.paper,
                },
                onLoad: () => setLoading(false),
              })
            ) : (
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
              />
            )
          ) : null}
        </>
      )}
      {visible ? <ModalToastHost /> : null}
    </>
  )

  if (dialog) {
    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogPanel, useExternal && styles.dialogPanelCompact]}>{body}</View>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, androidTop > 0 ? { paddingTop: androidTop } : null]}>{body}</View>
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
    height: "86%",
    maxHeight: 860,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: colors.paper,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dialogPanelCompact: {
    height: "auto",
    maxHeight: 520,
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
  spinner: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -20,
    zIndex: 1,
    pointerEvents: "none",
  },
  webView: { flex: 1 },
  externalBody: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 14,
    alignItems: "center",
  },
  externalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroBody,
    marginBottom: 4,
  },
  externalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  externalBodyText: {
    fontSize: typeSize.meta,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 360,
    marginBottom: 8,
  },
})
