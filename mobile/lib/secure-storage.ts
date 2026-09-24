import AsyncStorage from "@react-native-async-storage/async-storage"
import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"

const memory = new Map<string, string>()

function isSsr(): boolean {
  return typeof window === "undefined" && Platform.OS === "web"
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

/**
 * Auth JWTs are too large for Expo Go SecureStore (~2KB); session uses AsyncStorage.
 * PIN secrets stay in SecureStore via secretGet/Set.
 */
export const supabaseAuthStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key).catch(() => null),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value).catch(() => undefined),
  removeItem: (key: string) => AsyncStorage.removeItem(key).catch(() => undefined),
}

export async function secretGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") return webGet(key)
  try {
    return await SecureStore.getItemAsync(key)
  } catch {
    return null
  }
}

export async function secretSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await webSet(key, value)
    return
  }
  try {
    await SecureStore.setItemAsync(key, value)
  } catch {
    // Expo Go / simulator can reject SecureStore; PIN setup can retry later
  }
}

export async function secretDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await webRemove(key)
    return
  }
  try {
    await SecureStore.deleteItemAsync(key)
  } catch {
    // ignore
  }
}
