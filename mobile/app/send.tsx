import { useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native"
import { useTranslation } from "react-i18next"
import QRCode from "react-native-qrcode-svg"
import { Screen } from "@/components/screen"
import { fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export default function SendScreen() {
  const { t } = useTranslation("app")
  const { user } = useAuth()
  const router = useRouter()
  const [sendAmount, setSendAmount] = useState("100")
  const [sendCurrency, setSendCurrency] = useState("USD")
  const [receiveCurrency, setReceiveCurrency] = useState("NGN")
  const [recipientId, setRecipientId] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    setBusy(true)
    setError("")
    const res = await fetchWithAuth("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sendAmount: Number(sendAmount),
        sendCurrency,
        receiveCurrency,
        recipientId: recipientId || null,
        fulfillmentType: "bank_transfer",
      }),
    })
    setBusy(false)
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError((body as { error?: string }).error || "Failed")
      return
    }
    const id = (body as { transaction?: { transaction_id: string } }).transaction?.transaction_id
    if (id) router.push(`/orders/${id.toLowerCase()}`)
  }

  return (
    <Screen className="px-5">
      <Text className="mb-4 text-2xl font-bold">{t("send.title", { defaultValue: "Send money" })}</Text>
      <TextInput value={sendAmount} onChangeText={setSendAmount} keyboardType="decimal-pad" className="mb-3 rounded-xl border border-gray-200 px-3 py-3" placeholder="Amount" />
      <TextInput value={sendCurrency} onChangeText={setSendCurrency} autoCapitalize="characters" className="mb-3 rounded-xl border border-gray-200 px-3 py-3" placeholder="Send currency" />
      <TextInput value={receiveCurrency} onChangeText={setReceiveCurrency} autoCapitalize="characters" className="mb-3 rounded-xl border border-gray-200 px-3 py-3" placeholder="Receive currency" />
      <TextInput value={recipientId} onChangeText={setRecipientId} className="mb-3 rounded-xl border border-gray-200 px-3 py-3" placeholder="Recipient id" />
      {error ? <Text className="mb-3 text-red-600">{error}</Text> : null}
      <Pressable onPress={() => void submit()} disabled={busy} className="items-center rounded-xl bg-primary py-3.5">
        {busy ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">{t("send.continue", { defaultValue: "Continue" })}</Text>}
      </Pressable>
      {user ? (
        <View className="mt-8 items-center">
          <Text className="mb-3 text-gray-500">Pay QR</Text>
          <QRCode value={`ciuna://pay/${user.id}`} size={160} color="#111827" backgroundColor="#ffffff" />
        </View>
      ) : null}
    </Screen>
  )
}
