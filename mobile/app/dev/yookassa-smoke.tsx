/**
 * Dev-only: prove the native YooKassa sheet opens in a store/prebuild binary.
 * Open via `/dev/yookassa-smoke`. Uses sandbox EXPO_PUBLIC_YOOKASSA_* keys only.
 */
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Redirect } from "expo-router"

import YooKassaNative from "../../modules/yookassa-payment/src/index"

export default function YooKassaSmokeScreen() {
  const available = YooKassaNative.isAvailable()
  const [status, setStatus] = useState<string>(available ? "ready" : "native module not linked")
  const [busy, setBusy] = useState(false)

  async function openSheet() {
    setBusy(true)
    setStatus("opening sheet…")
    try {
      const result = await YooKassaNative.startPayment({
        amount: 10,
        currency: "RUB",
        shopName: "Ciuna sandbox",
        description: "YooKassa smoke test (cancel OK)",
      })
      const token = YooKassaNative.takeLastPaymentToken()
      setStatus(
        token?.token
          ? `result: ${result}; token type=${token.type} (len=${token.token.length})`
          : `result: ${result}`,
      )
    } catch (e) {
      setStatus(`error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  if (!__DEV__) return <Redirect href="/" />

  return (
    <View style={styles.root}>
      <Text style={styles.title}>YooKassa native smoke</Text>
      <Text style={styles.meta}>available: {String(available)}</Text>
      <Text style={styles.meta}>status: {status}</Text>
      <Pressable
        style={[styles.btn, (!available || busy) && styles.btnDisabled]}
        disabled={!available || busy}
        onPress={openSheet}
      >
        <Text style={styles.btnText}>{busy ? "Waiting…" : "Open sandbox sheet"}</Text>
      </Pressable>
      <Text style={styles.hint}>Cancel after the sheet appears — that still proves compile + link.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, justifyContent: "center", gap: 12, backgroundColor: "#0f1419" },
  title: { color: "#f5f7fa", fontSize: 22, fontWeight: "700" },
  meta: { color: "#c5ccd6", fontSize: 15 },
  btn: { marginTop: 12, backgroundColor: "#2f6fed", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  hint: { color: "#8b95a5", fontSize: 13, marginTop: 8 },
})
