import Constants from "expo-constants"

const APPLE_SCRIPT_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"

const DEFAULT_APPLE_WEB_CLIENT_ID = "com.ciuna.app.web"
const IOS_BUNDLE_ID = Constants.expoConfig?.ios?.bundleIdentifier?.trim() || "com.ciuna.app"

type AppleUserName = { firstName?: string; lastName?: string }
type AppleWebSignInResult = { idToken: string; fullName?: string }
type AppleAuthResponse = {
  authorization?: { id_token?: string }
  user?: { name?: AppleUserName }
}
type AppleAuthError = { error?: string; error_description?: string }

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string
          scope: string
          redirectURI: string
          usePopup: boolean
        }) => void
        signIn: () => Promise<AppleAuthResponse>
      }
    }
  }
}

let scriptLoadPromise: Promise<void> | null = null

function appleWebClientId(): string {
  const extra = Constants.expoConfig?.extra as { appleWebClientId?: string } | undefined
  return extra?.appleWebClientId?.trim() || process.env.EXPO_PUBLIC_APPLE_WEB_CLIENT_ID?.trim() || DEFAULT_APPLE_WEB_CLIENT_ID
}

function appleWebRedirectUri(): string {
  if (typeof window === "undefined") return "https://app.ciuna.com/auth/callback"
  const extra = Constants.expoConfig?.extra as { appleWebRedirectUri?: string } | undefined
  const override = extra?.appleWebRedirectUri?.trim() || process.env.EXPO_PUBLIC_APPLE_WEB_REDIRECT_URI?.trim()
  if (override) return override.replace(/\/$/, "")
  return `${window.location.origin}/auth/callback`.replace(/\/$/, "")
}

function loadAppleIdScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Sign in with Apple is only available in a browser."))
  if (window.AppleID?.auth) return Promise.resolve()
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${APPLE_SCRIPT_SRC}"]`)
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true })
        existing.addEventListener("error", () => reject(new Error("Failed to load Sign in with Apple.")), { once: true })
        return
      }
      const script = document.createElement("script")
      script.src = APPLE_SCRIPT_SRC
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Sign in with Apple."))
      document.head.appendChild(script)
    })
  }
  return scriptLoadPromise
}

function formatAppleAuthFailure(error: unknown, clientId: string, redirectURI: string): Error {
  const appleError = error as AppleAuthError | null
  const code = appleError?.error
  const description = appleError?.error_description
  if (code === "invalid_client") {
    return new Error(
      `Apple rejected the web client ID "${clientId}". Use a Services ID (not ${IOS_BUNDLE_ID}) and add return URL ${redirectURI}.`,
    )
  }
  if (code === "invalid_request" && description?.toLowerCase().includes("redirect")) {
    return new Error(`Apple rejected the redirect URI "${redirectURI}". Add this exact return URL to your Services ID.`)
  }
  if (description) return new Error(description)
  if (error instanceof Error) return error
  return new Error("Unable to continue with Apple.")
}

export async function signInWithAppleWeb(): Promise<AppleWebSignInResult> {
  const clientId = appleWebClientId()
  if (clientId === IOS_BUNDLE_ID) {
    throw new Error(`Apple web sign-in must use a Services ID (e.g. ${DEFAULT_APPLE_WEB_CLIENT_ID}), not the iOS bundle ID.`)
  }
  await loadAppleIdScript()
  const redirectURI = appleWebRedirectUri()
  window.AppleID!.auth.init({
    clientId,
    scope: "name email",
    redirectURI,
    usePopup: true,
  })
  let response: AppleAuthResponse
  try {
    response = await window.AppleID!.auth.signIn()
  } catch (error) {
    const code = (error as AppleAuthError | null)?.error
    if (code === "popup_closed_by_user" || code === "user_cancelled_authorize") {
      throw new Error("ERR_APPLE_SIGN_IN_CANCELED")
    }
    throw formatAppleAuthFailure(error, clientId, redirectURI)
  }
  const idToken = response.authorization?.id_token
  if (!idToken) throw new Error("Apple sign-in did not return an identity token.")
  const name = response.user?.name
  const fullName = name ? [name.firstName, name.lastName].filter(Boolean).join(" ") : undefined
  return { idToken, fullName: fullName || undefined }
}

export function isAppleWebSignInCanceled(error: unknown): boolean {
  return error instanceof Error && error.message === "ERR_APPLE_SIGN_IN_CANCELED"
}
