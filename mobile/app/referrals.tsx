import * as Clipboard from "expo-clipboard"
import { useEffect, useState } from "react"
import { Pressable, Share, Text, View } from "react-native"
import QRCode from "react-native-qrcode-svg"
import { Screen } from "@/components/screen"
import { fetchWithAuth } from "@/lib/api"
import { APP_URLS } from "@ciuna/shared/urls"

export default function ReferralsScreen() {
  const [slug, setSlug] = useState("")
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    void (async () => {
      const res = await fetchWithAuth("/api/referrals/me")
      const data = await res.json()
      setSlug(data.referralSlug || data.slug || "")
    })()
  }, [])
  const url = slug ? `${APP_URLS.app}/${slug}` : ""
  return (
    <Screen className="px-5">
      <Text className="mb-3 text-2xl font-bold">Referrals</Text>
      <Text className="text-gray-500">{url || "Loading…"}</Text>
      {url ? (
        <>
          <View className="my-6 items-center">
            <QRCode value={url} size={160} color="#111827" backgroundColor="#ffffff" />
          </View>
          <Pressable
            onPress={() => {
              void Clipboard.setStringAsync(url)
              setCopied(true)
            }}
            className="mb-3 items-center rounded-xl border border-gray-200 py-3"
          >
            <Text className="font-semibold">{copied ? "Copied" : "Copy link"}</Text>
          </Pressable>
          <Pressable onPress={() => void Share.share({ message: url, url })}>
            <Text className="text-center font-semibold text-primary">Share link</Text>
          </Pressable>
        </>
      ) : null}
    </Screen>
  )
}
