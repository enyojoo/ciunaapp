import * as ExpoCrypto from "expo-crypto"

/**
 * Supabase PKCE needs `crypto.subtle.digest` (SHA-256). Hermes / Expo Go often
 * expose `crypto` without `subtle`, which makes auth-js fall back to `plain`.
 */
function algorithmName(algorithm: AlgorithmIdentifier): string {
  return typeof algorithm === "string" ? algorithm : algorithm.name
}

function toExpoAlgo(name: string): ExpoCrypto.CryptoDigestAlgorithm {
  switch (name.toUpperCase().replace(/-/g, "")) {
    case "SHA1":
      return ExpoCrypto.CryptoDigestAlgorithm.SHA1
    case "SHA384":
      return ExpoCrypto.CryptoDigestAlgorithm.SHA384
    case "SHA512":
      return ExpoCrypto.CryptoDigestAlgorithm.SHA512
    default:
      return ExpoCrypto.CryptoDigestAlgorithm.SHA256
  }
}

function installSubtle(cryptoObj: Crypto, subtle: SubtleCrypto): boolean {
  try {
    Object.defineProperty(cryptoObj, "subtle", { configurable: true, value: subtle })
    return typeof cryptoObj.subtle?.digest === "function"
  } catch {
    return false
  }
}

export function ensureWebCrypto(): void {
  const current = globalThis.crypto
  if (typeof current?.subtle?.digest === "function") return

  const getRandomValues = <T extends ArrayBufferView>(arr: T): T => {
    if (typeof current?.getRandomValues === "function") return current.getRandomValues(arr as never) as T
    return ExpoCrypto.getRandomValues(arr as never) as T
  }

  const subtle = {
    digest: (algorithm: AlgorithmIdentifier, data: BufferSource) =>
      ExpoCrypto.digest(toExpoAlgo(algorithmName(algorithm)), data),
  } as SubtleCrypto

  if (current && installSubtle(current, subtle)) {
    if (typeof current.getRandomValues !== "function") {
      try {
        Object.defineProperty(current, "getRandomValues", { configurable: true, value: getRandomValues })
      } catch {
        // host object may be sealed; getRandomValues already exists on most RN builds
      }
    }
    return
  }

  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: { ...(current ?? {}), getRandomValues, subtle },
  })
}

ensureWebCrypto()
