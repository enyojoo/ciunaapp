import { useEffect, useState } from "react"
import { AppState, Linking, Platform, Pressable, Text, View } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Crypto from "expo-crypto"
import * as DocumentPicker from "expo-document-picker"
import { useTranslation } from "react-i18next"
import { useMarketplaceCheckout, type MarketplaceOrder, type PurchaseSource } from "@ciuna/shared/marketplace/use-checkout"
import { fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Field } from "@/components/field"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { YooKassaCheckoutWidget } from "@/components/yookassa-checkout-widget"
import { startYooKassaPayment, resumeYooKassaPayment, isYooKassaNativeAvailable } from "@/lib/yookassa-native"

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      className={`mb-2 min-h-[48px] justify-center rounded-xl border p-4 ${selected ? "border-primary bg-orange-50" : "border-border bg-surface"}`}
    >
      <Text>{label}</Text>
    </Pressable>
  )
}
export function MarketplaceCheckout({
  source,
  customAmount = false,
}: {
  source: PurchaseSource
  customAmount?: boolean
}) {
  const { profile } = useAuth(),
    { t } = useTranslation("app"),
    [amount, setAmount] = useState(""),
    [otherCurrency, setOtherCurrency] = useState(false)
  const actual =
    source.kind === "product" && customAmount ? { ...source, fundedAmount: Number(amount) } : source
  const c = useMarketplaceCheckout({
    source: actual,
    userId: profile?.id,
    fetcher: fetchWithAuth,
    storage: AsyncStorage,
    uuid: Crypto.randomUUID,
    gatewayMode: Platform.OS === "web" ? "embedded" : "native",
    initialName: [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
    initialPhone: profile?.phone || "",
  })
  const label = (key: string) => t(`marketplace.${key}`),
    q = c.quote
  if (c.order) return <><MarketplaceOrderView order={c.order} onChange={c.saveOrder}/>{source.kind==='product'&&['fulfilled','cancelled'].includes(c.order.fulfillment_state)&&<View className="p-4"><PrimaryButton label={t('marketplace.newPurchase')} onPress={()=>void c.newPurchase()}/></View>}</>
  return (
    <ScreenScroll keyboard edges={["left", "right", "bottom"]}>
      <View className="gap-4 pb-8">
        <Text className="text-2xl font-semibold">{label("checkout")}</Text>
        {c.error && (
          <Text accessibilityRole="alert" className="text-red-700">
            {t(`marketplace.errors.${c.error}`, { defaultValue: label("retryError") })}
          </Text>
        )}
        {customAmount && (
          <Field
            label={label("amount")}
            accessibilityLabel={label("amount")}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        )}
        {!q && !c.error && !c.hasPending && <Text>{label("loading")}</Text>}
        {q && (
          <>
            <View className="gap-2 rounded-2xl bg-surface p-4">
              <Text className="text-lg font-semibold">{q.title}</Text>
              {q.lines.map((l) => (
                <Text key={l.id}>
                  {l.quantity} × {l.title} · {(l.unitPrice * l.quantity).toFixed(2)}{" "}
                  {q.totals.productCurrency}
                </Text>
              ))}
              <Text>
                {label("serviceFee")}: {q.totals.marketplaceFee.toFixed(2)} {q.totals.productCurrency}
              </Text>
              {q.fulfillmentMode === "delivery" && (
                <Text>
                  {label("deliveryFee")}: {q.totals.deliveryFee.toFixed(2)} {q.totals.productCurrency}
                </Text>
              )}
              {!!q.totals.corridorFee && (
                <Text>
                  {label("conversionFee")}: {q.totals.corridorFee.toFixed(2)} {q.totals.payCurrency}
                </Text>
              )}
              <Text className="text-xl font-semibold">
                {label("total")}: {q.totals.total.toFixed(2)} {q.totals.payCurrency}
              </Text>
            </View>
            <Text className="font-semibold">{label("fulfillment")}</Text>
            {q.modes.map((m) => (
              <Choice
                key={m}
                label={label(m)}
                selected={q.fulfillmentMode === m}
                onPress={() => c.setFulfillmentMode(m)}
              />
            ))}
            {!!q.instructions && <Text>{q.instructions}</Text>}
            {!!q.slotStart && (
              <Text>
                {new Date(q.slotStart).toLocaleString(undefined, { timeZone: q.timezone })} —{" "}
                {new Date(q.slotEnd!).toLocaleTimeString(undefined, { timeZone: q.timezone })} ({q.timezone})
              </Text>
            )}
            {q.fulfillmentMode === "delivery" && (
              <>
                <Text>{label("zone")}</Text>
                {q.zones.map((z) => (
                  <Choice
                    key={z.id}
                    label={`${z.city} · ${z.district} · ${z.fee.toFixed(2)} ${z.currency}`}
                    selected={c.deliveryZoneId === z.id}
                    onPress={() => c.setDeliveryZoneId(z.id)}
                  />
                ))}
                <Field
                  label={label("address")}
                  accessibilityLabel={label("address")}
                  value={c.address}
                  onChangeText={c.setAddress}
                />
              </>
            )}
            <Field
              label={label("name")}
              accessibilityLabel={label("name")}
              value={c.contactName}
              onChangeText={c.setContactName}
              autoComplete="name"
            />
            <Field
              label={`${label("phone")}${q.requirePhone ? "" : ` (${label("optional")})`}`}
              accessibilityLabel={label("phone")}
              value={c.contactPhone}
              onChangeText={c.setContactPhone}
              keyboardType="phone-pad"
            />
            <Text>{label("receiptEmail")}</Text>
            {q.lines.map((l) =>
              l.fields.map((f) => (
                <View key={`${l.id}:${f.key}`}>
                  {f.type === "select" ? (
                    <>
                      <Text>{f.label}</Text>
                      {f.options?.map((o) => (
                        <Choice
                          key={o.value}
                          label={o.label}
                          selected={c.answers[l.id]?.[f.key] === o.value}
                          onPress={() =>
                            c.setAnswers((a) => ({ ...a, [l.id]: { ...a[l.id], [f.key]: o.value } }))
                          }
                        />
                      ))}
                    </>
                  ) : (
                    <Field
                      label={`${l.title} · ${f.label}${f.required ? " *" : ""}`}
                      accessibilityLabel={f.label}
                      multiline={f.type === "textarea"}
                      keyboardType={f.type === "number" ? "decimal-pad" : "default"}
                      value={String(c.answers[l.id]?.[f.key] ?? "")}
                      onChangeText={(v) =>
                        c.setAnswers((a) => ({
                          ...a,
                          [l.id]: { ...a[l.id], [f.key]: f.type === "number" ? Number(v) : v },
                        }))
                      }
                    />
                  )}
                </View>
              )),
            )}
            <Field
              label={label("note")}
              accessibilityLabel={label("note")}
              value={c.note}
              onChangeText={c.setNote}
              multiline
            />
            <PrimaryButton
              label={label("otherCurrency")}
              variant="ghost"
              onPress={() => setOtherCurrency((v) => !v)}
            />
            {otherCurrency &&
              q.payCurrencies.map((cur) => (
                <Choice
                  key={cur}
                  label={cur}
                  selected={q.totals.payCurrency === cur}
                  onPress={() => c.setPayCurrency(cur)}
                />
              ))}
            <Text className="font-semibold">{label("payWith")}</Text>
            {q.methods.map((m) => (
              <Choice
                key={m.id}
                label={m.rail === "yookassa" ? label("online") : m.name}
                selected={c.methodId === m.id}
                onPress={() => c.setMethodId(m.id)}
              />
            ))}
            {!q.checkoutReady && <Text>{label("unavailable")}</Text>}
          </>
        )}
        <PrimaryButton
          label={c.hasPending ? label("resume") : label("placeOrder")}
          busy={c.busy}
          disabled={
            !c.hasPending &&
            (!q?.checkoutReady ||
              !c.contactName.trim() ||
              (q.requirePhone && !c.contactPhone.trim()) ||
              (q.fulfillmentMode === "delivery" && !c.address.trim()))
          }
          onPress={() => void c.submit()}
        />
      </View>
    </ScreenScroll>
  )
}
export function MarketplaceOrderView({
  order: initial,
  onChange,
}: {
  order: MarketplaceOrder
  onChange?: (order: MarketplaceOrder) => unknown
}) {
  const [order, setOrder] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    { t } = useTranslation("app")
  const label = (key: string) => t(`marketplace.${key}`)
  async function load() {
    const r = await fetchWithAuth(`/api/hub/orders/${initial.id}`)
    if (r.ok) {
      const d = await r.json()
      setOrder(d.order)
      onChange?.(d.order)
    }
  }
  useEffect(() => {
    setOrder(initial)
  }, [initial])
  useEffect(() => {
    const timer = setInterval(() => void load(), 5000),
      subscription = AppState.addEventListener("change", (s) => {
        if (s === "active") void load()
      })
    return () => {
      clearInterval(timer)
      subscription.remove()
    }
  }, [initial.id])
  async function action(path: string, body: unknown = {}) {
    setBusy(true)
    setError("")
    try {
      const r = await fetchWithAuth(`/api/hub/orders/${order.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) throw Error(d.errorCode || d.error)
      await load()
      return d
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function upload() {
    try {
      const selected = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "application/pdf"],
        copyToCacheDirectory: true,
      })
      if (selected.canceled) return
      const file = selected.assets[0],
        a = order.attempts[0]
      if ((file.size || 0) > 10 * 1024 * 1024) throw Error("INVALID_PROOF")
      const init = await action("payment-proof", {
        attemptId: a.id,
        extension: file.name.split(".").pop()?.toLowerCase(),
      })
      if (!init) return
      setBusy(true)
      const blob = await (await fetch(file.uri)).blob()
      const r = await fetch(init.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.mimeType || "application/octet-stream" },
        body: blob,
      })
      if (!r.ok) throw Error("UPLOAD_FAILED")
      await action("payment-proof", { attemptId: a.id, path: init.path })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const a = order.attempts[0],
    pay = order.nextAction === "pay" && !["failed", "superseded", "succeeded"].includes(a?.state || "")
  async function nativePay() {
    if (!a) return
    setBusy(true)
    try {
      if (!isYooKassaNativeAvailable()) throw Error("NATIVE_BUILD_REQUIRED")
      if (a.confirmation_mode === "embedded") {
        await Linking.openURL(`https://app.ciuna.com/hub/orders/${order.public_id}`)
      } else if (a.confirmation_url && a.native_payment_type) {
        await resumeYooKassaPayment(a.confirmation_url, a.native_payment_type)
      } else if (a.state === "created") {
        await startYooKassaPayment({
          transactionId: order.public_id,
          attemptId: a.id,
          amount: order.snapshot.totals.total,
          currency: order.snapshot.totals.payCurrency,
          shopName: "Ciuna",
          description: order.snapshot.title,
        })
      }
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <ScreenScroll keyboard edges={["left", "right", "bottom"]}>
      <View className="gap-4 pb-8">
        <Text className="text-2xl font-semibold">{order.snapshot.title}</Text>
        <Text>{order.public_id}</Text>
        <Text className="text-xl font-semibold">
          {label("total")}: {order.snapshot.totals.total.toFixed(2)} {order.snapshot.totals.payCurrency}
        </Text>
        <View accessibilityLiveRegion="polite">
          <Text>
            {label("payment")}: {label(order.payment_state)}
          </Text>
          <Text>
            {label("fulfillment")}: {label(order.fulfillment_state)}
          </Text>
        </View>
        {!!error && (
          <Text accessibilityRole="alert">
            {t(`marketplace.errors.${error}`, { defaultValue: label("retryError") })}
          </Text>
        )}
        {!!order.exception_reason && <Text>{label("review")}</Text>}
        {["pay", "checking"].includes(order.nextAction) && (
          <Text>
            {label("deadline")}: {new Date(order.payment_deadline).toLocaleString()}
          </Text>
        )}
        {pay &&
          a?.rail === "yookassa" &&
          (Platform.OS === "web" ? (
            <YooKassaCheckoutWidget
              transactionId={order.public_id}
              confirmationToken={a.confirmation_token}
              onCompleted={() => void load()}
              onFailed={() => void load()}
            />
          ) : (
            <PrimaryButton label={label("online")} busy={busy} onPress={() => void nativePay()} />
          ))}
        {pay && a?.rail === "manual" && (
          <View className="gap-2">
            <Text className="font-semibold">{label("instructions")}</Text>
            {Object.entries(a.instructions)
              .filter(([k]) => !["type", "name"].includes(k))
              .map(([k, v]) => (
                <Text selectable key={k}>
                  {t(`marketplace.instructionsLabels.${k}`, { defaultValue: k.replaceAll("_", " ") })}:{" "}
                  {String(v)}
                </Text>
              ))}
            <Text selectable>
              {label("reference")}: {order.public_id}
            </Text>
            <PrimaryButton label={label("proof")} busy={busy} onPress={() => void upload()} />
            {a.state === "proof_submitted" && <Text>{label("proof_submitted")}</Text>}
          </View>
        )}
        {order.nextAction === "pay" &&
          order.snapshot.methods.map((m) => (
            <PrimaryButton
              key={m.id}
              variant="secondary"
              label={`${label("payWith")} ${m.rail === "yookassa" ? label("online") : m.name}`}
              busy={busy}
              onPress={() =>
                void action("payment-attempts", {
                  rail: m.rail,
                  paymentMethodId: m.rail === "manual" ? m.id : undefined,
                  gatewayMode: Platform.OS === "web" ? "embedded" : "native",
                })
              }
            />
          ))}
        {!!order.snapshot.instructions && <Text>{order.snapshot.instructions}</Text>}
        {!!order.digital_content && (
          <View className="rounded-xl bg-surface p-4">
            <Text className="font-semibold">{label("digitalDelivery")}</Text>
            <Text selectable>{order.digital_content}</Text>
          </View>
        )}
        {order.events.map((e) => (
          <View key={e.id}>
            <Text>{t(`marketplace.events.${e.kind}`, { defaultValue: label("updated") })}</Text>
            <Text>{new Date(e.created_at).toLocaleString()}</Text>
          </View>
        ))}
        {order.canCancel && (
          <PrimaryButton
            label={label("cancel")}
            variant="secondary"
            busy={busy}
            onPress={() => void action("cancel")}
          />
        )}
        <PrimaryButton
          label={label("support")}
          variant="ghost"
          onPress={() =>
            void Linking.openURL(`mailto:support@ciuna.com?subject=${encodeURIComponent(order.public_id)}`)
          }
        />
      </View>
    </ScreenScroll>
  )
}
