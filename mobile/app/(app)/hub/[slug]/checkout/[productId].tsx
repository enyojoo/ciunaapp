import { useEffect, useState } from "react"
import { Text, View } from "react-native"
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Field } from "@/components/field"
import { PayStep } from "@/components/pay-step"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { fetchWithAuth } from "@/lib/api"
import { useToast } from "@/components/toast-provider"
import { hubProductEffectivePrice } from "@/lib/money"
import { useAuth } from "@/lib/auth-context"
import { useFx } from "@/lib/use-fx"
import type { HubProduct } from "@/lib/types"

export default function HubCheckoutScreen() {
  const { productId } = useLocalSearchParams<{ slug: string; productId: string }>()
  const router = useRouter()
  const { profile } = useAuth()
  const { currencies, rates } = useFx()
  const [product, setProduct] = useState<HubProduct | null>(null)
  const [contactName, setContactName] = useState(
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
  )
  const [contactPhone, setContactPhone] = useState("")
  const [delivery, setDelivery] = useState("")
  const [sendCurrency, setSendCurrency] = useState("USD")
  const [receiveCurrency, setReceiveCurrency] = useState("NGN")
  const { showError } = useToast()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!productId) return
    void (async () => {
      const res = await fetchWithAuth(`/api/hub/products/${encodeURIComponent(String(productId))}`)
      if (!res.ok) return
      const body = (await res.json()) as { product?: HubProduct }
      const p = body.product || null
      setProduct(p)
      const cur = (p?.fixed_currency || p?.default_input_currency || "USD").toUpperCase()
      setReceiveCurrency(cur)
    })()
  }, [productId])

  const amount = product ? String(hubProductEffectivePrice(product)) : ""

  const submit = async () => {
    if (!product) return
    setBusy(true)
    const res = await fetchWithAuth("/api/hub/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hubProductId: product.id,
        sendCurrency,
        receiveCurrency,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        deliveryAddressLine: delivery.trim() || null,
        formAnswers: {},
        idempotencyKey: `${product.id}:${Date.now()}`,
      }),
    })
    const body = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      showError((body as { error?: string }).error || "Payment failed. Try again.")
      return
    }
    const id = (body as { transaction?: { transaction_id: string } }).transaction?.transaction_id
    if (id) router.replace(`/orders/${id.toLowerCase()}` as never)
  }

  return (
    <ScreenScroll keyboard>
      {product?.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 16, marginBottom: 12 }}
          contentFit="cover"
        />
      ) : null}
      <Text className="text-xl font-semibold text-gray-900">{product?.title || "Checkout"}</Text>
      {product?.vendor?.name ? <Text className="mt-1 text-sm text-muted">{product.vendor.name}</Text> : null}
      <View className="mt-4">
        <PayStep
          sendAmount={amount}
          amountLabel="Order total"
          amountEditable={false}
          sendCurrency={sendCurrency}
          receiveCurrency={receiveCurrency}
          onChangeSendCurrency={setSendCurrency}
          onChangeReceiveCurrency={setReceiveCurrency}
          currencies={currencies}
          rates={rates}
        />
        <Field label="Contact name" value={contactName} onChangeText={setContactName} />
        <Field label="Phone" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
        <Field label="Delivery address (optional)" value={delivery} onChangeText={setDelivery} />
        <PrimaryButton label="Pay" onPress={() => void submit()} busy={busy} disabled={!contactName.trim() || !contactPhone.trim()} />
      </View>
    </ScreenScroll>
  )
}
