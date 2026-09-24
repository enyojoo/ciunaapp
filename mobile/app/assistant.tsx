import { useState } from "react"
import { ActivityIndicator, Pressable, Text } from "react-native"
import { AppTextInput } from "@/components/app-text-input"
import { Screen } from "@/components/screen"
import { fetchWithAuth } from "@/lib/api"

export default function AssistantScreen() {
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState("")

  const submit = async () => {
    setBusy(true)
    const res = await fetchWithAuth("/api/assistant/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "run_errands", notes }),
    })
    setBusy(false)
    setDone(res.ok ? "Submitted" : "Failed")
  }

  return (
    <Screen padded>
      <Text className="mb-3 text-2xl font-bold">Assistant</Text>
      <AppTextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="What do you need?"
        multiline
        className="mb-3 min-h-[120px] rounded-xl border border-gray-200 px-3 py-3 web:outline-none web:focus:border-primary web:focus:ring-2 web:focus:ring-orange-200"
      />
      <Pressable onPress={() => void submit()} className="items-center rounded-xl bg-primary py-3.5">
        {busy ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">Submit</Text>}
      </Pressable>
      {done ? <Text className="mt-3 text-gray-500">{done}</Text> : null}
    </Screen>
  )
}
