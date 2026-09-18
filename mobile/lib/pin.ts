import * as Crypto from "expo-crypto"
import * as LocalAuthentication from "expo-local-authentication"
import { Platform } from "react-native"
import { secretDelete, secretGet, secretSet } from "./secure-storage"

const pinKey = (userId: string) => `ciuna_pin_${userId}`

export async function hasPin(userId: string): Promise<boolean> {
  const v = await secretGet(pinKey(userId))
  return Boolean(v)
}

export async function setPin(userId: string, pin: string): Promise<void> {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${userId}:${pin}`)
  await secretSet(pinKey(userId), digest)
}

export async function clearPin(userId: string): Promise<void> {
  await secretDelete(pinKey(userId))
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const stored = await secretGet(pinKey(userId))
  if (!stored) return false
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${userId}:${pin}`)
  return stored === digest
}

export async function tryBiometricUnlock(): Promise<boolean> {
  if (Platform.OS === "web") return false
  const has = await LocalAuthentication.hasHardwareAsync()
  const enrolled = await LocalAuthentication.isEnrolledAsync()
  if (!has || !enrolled) return false
  const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock Ciuna" })
  return result.success
}
