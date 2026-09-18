import AsyncStorage from "@react-native-async-storage/async-storage"
import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"

const CHUNK = 1800
const memory = new Map<string, string>()

function isSsr(): boolean {
  return typeof window === "undefined" && Platform.OS === "web"
}

async function nativeGet(key: string): Promise<string | null> {
  const chunksRaw = await SecureStore.getItemAsync(`${key}_chunks`)
  if (!chunksRaw) {
    return SecureStore.getItemAsync(key)
  }
  const chunks = Number(chunksRaw)
  let value = ""
  for (let i = 0; i < chunks; i++) {
    value += (await SecureStore.getItemAsync(`${key}_${i}`)) ?? ""
  }
  return value || null
}

async function nativeSet(key: string, value: string): Promise<void> {
  const chunks = Math.ceil(value.length / CHUNK) || 1
  await SecureStore.setItemAsync(`${key}_chunks`, String(chunks))
  for (let i = 0; i < chunks; i++) {
    await SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK))
  }
}

async function nativeRemove(key: string): Promise<void> {
  const chunksRaw = await SecureStore.getItemAsync(`${key}_chunks`)
  const chunks = chunksRaw ? Number(chunksRaw) : 0
  await SecureStore.deleteItemAsync(key)
  await SecureStore.deleteItemAsync(`${key}_chunks`)
  for (let i = 0; i < chunks; i++) {
    await SecureStore.deleteItemAsync(`${key}_${i}`)
  }
}

async function webGet(key: string): Promise<string | null> {
  if (isSsr()) return memory.get(key) ?? null
  return AsyncStorage.getItem(key)
}

async function webSet(key: string, value: string): Promise<void> {
  if (isSsr()) {
    memory.set(key, value)
    return
  }
  await AsyncStorage.setItem(key, value)
}

async function webRemove(key: string): Promise<void> {
  if (isSsr()) {
    memory.delete(key)
    return
  }
  await AsyncStorage.removeItem(key)
}

export const supabaseAuthStorage = {
  getItem: (key: string) => (Platform.OS === "web" ? webGet(key) : nativeGet(key)),
  setItem: (key: string, value: string) => (Platform.OS === "web" ? webSet(key, value) : nativeSet(key, value)),
  removeItem: (key: string) => (Platform.OS === "web" ? webRemove(key) : nativeRemove(key)),
}

export async function secretGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") return webGet(key)
  return SecureStore.getItemAsync(key)
}

export async function secretSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await webSet(key, value)
    return
  }
  await SecureStore.setItemAsync(key, value)
}

export async function secretDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await webRemove(key)
    return
  }
  await SecureStore.deleteItemAsync(key)
}
