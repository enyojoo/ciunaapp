import { Link, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { AuthFooter, AuthTitle, AuthTopBar, PasswordEye, SocialAuth } from "@/components/auth-chrome"
import { Field } from "@/components/field"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { ui } from "@/lib/theme"

export default function LoginScreen() {
  const { t } = useTranslation("app")
  const { user, signIn, signInWithGoogle, signInWithApple } = useAuth()
  const { showError } = useToast()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) router.replace("/")
  }, [router, user])

  const onSubmit = async () => {
    const trimmed = email.trim()
    if (!trimmed || !password) {
      showError(t("auth.fillAllFields", { defaultValue: "Please fill in all fields" }))
      return
    }
    setBusy(true)
    try {
      try {
        const statusRes = await apiFetch("/api/auth/login-attempt/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        })
        if (statusRes.ok) {
          const lockBody = (await statusRes.json()) as { locked?: boolean; remainingMinutes?: number }
          if (lockBody.locked) {
            showError(
              t("auth.accountTemporarilyLocked", {
                defaultValue: "Account locked. Try again in {{minutes}} minutes.",
                minutes: lockBody.remainingMinutes ?? 0,
              }),
            )
            return
          }
        }
      } catch {
        // Lock check is best-effort. CORS / offline must not block sign-in.
      }
      const { error: err } = await signIn(trimmed, password)
      if (err) {
        await apiFetch("/api/auth/login-attempt/failure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        }).catch(() => {})
        showError(friendlyLoginError(err, t("auth.loginError", { defaultValue: "Invalid credentials" })))
        return
      }
      await apiFetch("/api/auth/login-attempt/success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      }).catch(() => {})
      router.replace("/")
    } catch {
      showError(t("auth.genericError", { defaultValue: "An unexpected error occurred" }))
    } finally {
      setBusy(false)
    }
  }

  const onSocial = async (fn: () => Promise<{ error: string | null }>) => {
    setBusy(true)
    const { error: err } = await fn()
    setBusy(false)
    if (err) {
      showError(err)
      return
    }
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) router.replace("/")
  }

  return (
    <ScreenScroll keyboard contentStyle={styles.content}>
      <AuthTopBar />
      <AuthTitle>{t("auth.welcomeBack", { defaultValue: "Welcome back" })}</AuthTitle>
      <View style={styles.form}>
        <SocialAuth
          appleLabel={t("auth.signInApple", { defaultValue: "Sign in with Apple" })}
          googleLabel={t("auth.signInGoogle", { defaultValue: "Sign in with Google" })}
          orLabel={t("auth.or", { defaultValue: "Or" })}
          onApple={() => void onSocial(signInWithApple)}
          onGoogle={() => void onSocial(signInWithGoogle)}
          disabled={busy}
        />
        <Field
          label={t("auth.email", { defaultValue: "Email" })}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder={t("auth.emailPlaceholder", { defaultValue: "you@example.com" })}
          value={email}
          onChangeText={setEmail}
          returnKeyType="next"
        />
        <Field
          label={t("auth.password", { defaultValue: "Password" })}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          placeholder={t("auth.passwordPlaceholder", { defaultValue: "Enter your password" })}
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          onSubmitEditing={() => void onSubmit()}
          trailing={<PasswordEye show={show} onToggle={() => setShow((s) => !s)} />}
        />
        <Link href="/auth/forgot-password" asChild>
          <Pressable hitSlop={8} style={styles.forgot}>
            <Text style={ui.linkLeft}>{t("auth.forgotPassword", { defaultValue: "Forgot password?" })}</Text>
          </Pressable>
        </Link>
        <PrimaryButton
          label={busy ? t("auth.signingIn", { defaultValue: "Signing in…" }) : t("auth.signIn", { defaultValue: "Sign in" })}
          onPress={() => void onSubmit()}
          busy={busy}
        />
        <AuthFooter
          prompt={t("auth.noAccount", { defaultValue: "Don't have an account?" })}
          action={t("auth.signUp", { defaultValue: "Sign up" })}
          href="/auth/register"
        />
      </View>
    </ScreenScroll>
  )
}

function friendlyLoginError(err: string, fallback: string) {
  const lower = err.toLowerCase()
  if (
    lower.includes("invalid login") ||
    lower.includes("invalid email or password") ||
    lower.includes("invalid credentials")
  ) {
    return fallback
  }
  return err
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 8 },
  form: { width: "100%", maxWidth: 448, alignSelf: "center" },
  forgot: { alignSelf: "flex-start", marginBottom: 16 },
})
