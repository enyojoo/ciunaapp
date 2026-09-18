import { createElement, useEffect, useState } from "react"
import { ActivityIndicator, Modal, Platform, Pressable, StatusBar, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { WebView } from "react-native-webview"
import { X } from "lucide-react-native"
import { ModalToastHost } from "@/components/toast-provider"
import { colors, radius, type as typeSize } from "@/lib/theme"

export function ExternalLinkModal({
  visible,
  url,
  title,
  onClose,
}: {
  visible: boolean
  url: string
  title?: string
  onClose: () => void
}) {
  const [loading, setLoading] = useState(true)
  const insets = useSafeAreaInsets()
  const androidTop =
    Platform.OS === "android" ? Math.max(insets.top, StatusBar.currentHeight ?? 0) : 0

  useEffect(() => {
    if (visible && url) setLoading(true)
  }, [visible, url])

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, androidTop > 0 ? { paddingTop: androidTop } : null]}>
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
            />
          )
        ) : null}
        {visible ? <ModalToastHost /> : null}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
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
  spinner: { position: "absolute", top: "50%", left: "50%", marginLeft: -20, marginTop: -20, zIndex: 1, pointerEvents: "none" },
  webView: { flex: 1 },
})
