import { useEffect, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import { Image } from "expo-image"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Field } from "@/components/field"
import { PayStep } from "@/components/pay-step"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { hubProductEffectivePrice } from "@/lib/money"
import { useFx } from "@/lib/use-fx"
import { useHubProduct } from "@/lib/use-hub-product"
import { colors, radius, type as typeSize } from "@/lib/theme"

export default function HubCheckoutScreen() {
  const { productId } = useLocalSearchParams<{ slug: string; productId: string }>()
  const router = useRouter()
  const navigation = useNavigation()
  const { t } = useTranslation("app")
  const { profile } = useAuth()
  const { currencies, rates } = useFx()
  const { showError } = useToast()
  const { data: product, error: productError } = useHubProduct(productId)
  const [contactName, setContactName] = useState(
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
  )
  const [contactPhone, setContactPhone] = useState("")
  const [delivery, setDelivery] = useState("")
  const [sendCurrency, setSendCurrency] = useState("USD")
  const [receiveCurrency, setReceiveCurrency] = useState("NGN")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    navigation.setOptions({ title: t("hub.checkout.title", { defaultValue: "Checkout" }) })
  }, [navigation, t])

  useEffect(() => {
    if (productError) showError(t("hub.productNotFound", { defaultValue: "Product not found." }))
  }, [productError, showError, t])

  useEffect(() => {
    if (!product) return
    setReceiveCurrency((product.fixed_currency || product.default_input_currency || "USD").toUpperCase())
  }, [product])

  const amount = product ? String(hubProductEffectivePrice(product)) : ""

  const submit = async () => {
    if (!product) return
    if (!contactName.trim() || !contactPhone.trim()) {
      showError(t("auth.fillAllFields", { defaultValue: "Please fill in all fields" }))
      return
    }
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
      showError((body as { error?: string }).error || t("errors.generic", { defaultValue: "Payment failed. Try again." }))
      return
    }
    const id = (body as { transaction?: { transaction_id: string } }).transaction?.transaction_id
    if (id) router.replace(`/orders/${id.toLowerCase()}` as never)
  }

  return (
    <ScreenScroll keyboard edges={["left", "right"]}>
      <StatusBar style="dark" />
      {product?.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.noImage}>{t("hub.noImage", { defaultValue: "No image" })}</Text>
        </View>
      )}
      <Text style={styles.title}>{product?.title || t("hub.checkout.title", { defaultValue: "Checkout" })}</Text>
      {product?.vendor?.name ? <Text style={styles.vendor}>{product.vendor.name}</Text> : null}
      {product?.short_description ? <Text style={styles.desc}>{product.short_description}</Text> : null}
      <View style={styles.form}>
        <PayStep
          sendAmount={amount}
          amountLabel={t("hub.checkout.orderTotal", { defaultValue: "Order total" })}
          amountEditable={false}
          sendCurrency={sendCurrency}
          receiveCurrency={receiveCurrency}
          onChangeSendCurrency={setSendCurrency}
          onChangeReceiveCurrency={setReceiveCurrency}
          currencies={currencies}
          rates={rates}
        />
        <Field
          label={t("hub.checkout.fullName", { defaultValue: "Full name" })}
          value={contactName}
          onChangeText={setContactName}
        />
        <Field
          label={t("hub.checkout.phone", { defaultValue: "Phone" })}
          value={contactPhone}
          onChangeText={setContactPhone}
          keyboardType="phone-pad"
        />
        <Field
          label={t("hub.checkout.deliveryNotesAddressOptional", { defaultValue: "Delivery address (optional)" })}
          value={delivery}
          onChangeText={setDelivery}
        />
        <PrimaryButton
          label={t("hub.checkout.makePayment", { defaultValue: "Pay" })}
          onPress={() => void submit()}
          busy={busy}
          disabled={!contactName.trim() || !contactPhone.trim()}
        />
      </View>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  image: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.card, marginBottom: 12, backgroundColor: colors.paper },
  imageFallback: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.card,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noImage: { fontSize: typeSize.meta, color: colors.muted },
  title: { fontSize: 20, fontWeight: "600", color: colors.text },
  vendor: { marginTop: 4, fontSize: typeSize.meta, color: colors.muted },
  desc: { marginTop: 10, fontSize: typeSize.body, lineHeight: 22, color: colors.text },
  form: { marginTop: 16 },
})
