import AsyncStorage from "@react-native-async-storage/async-storage"

const KEY = "ciuna:send-return-path"

export async function setSendReturnPath(path: string | null) {
  if (!path) {
    await AsyncStorage.removeItem(KEY)
    return
  }
  await AsyncStorage.setItem(KEY, path)
}

export async function consumeSendReturnPath(): Promise<string | null> {
  const v = await AsyncStorage.getItem(KEY)
  if (v) await AsyncStorage.removeItem(KEY)
  return v
}
