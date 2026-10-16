import { useRouter } from "expo-router"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { AuthFooter, AuthTitle, AuthTopBar, PasswordEye, SocialAuth, useAuthBack, AuthNotice } from "@/components/auth-chrome"
import { Field } from "@/components/field"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { useToast } from "@/components/toast-provider"
import { useAuth } from "@/lib/auth-context"
import { useExternalLink } from "@/lib/external-link"
import { supabase } from "@/lib/supabase"
import { colors, type as typeSize } from "@/lib/theme"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterScreen() {
  const { t } = useTranslation("app")
  const { signUp, signInWithGoogle, signInWithApple } = useAuth()
  const { showError } = useToast()
  const { openLink } = useExternalLink()
  const router = useRouter()
  const onBack = useAuthBack()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const onSubmit = async () => {
    const trimmedEmail = email.trim()
    if (!fullName.trim() || !trimmedEmail || !password) {
      setNotice(t("auth.fillAllFields", { defaultValue: "Please fill in all fields" }))
      return
    }
    if (password.length < 6) {
      setNotice(t("auth.passwordMinLength", { defaultValue: "Password must be at least 6 characters long" }))
      return
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setNotice(t("auth.enterEmailAddress", { defaultValue: "Please enter a valid email address" }))
      return
    }
    setNotice(null)
    setBusy(true)
    const { error: err } = await signUp(trimmedEmail, password, fullName)
    setBusy(false)
    if (err) setNotice(err)
    else router.replace("/auth/login")
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
      <AuthTopBar onBack={onBack} />
      <AuthTitle>{t("auth.createAccountTitle", { defaultValue: "Create an Account" })}</AuthTitle>
      <Text style={styles.terms}>
        {t("auth.termsPrefix", { defaultValue: "By creating an account you agree to our" })}{" "}
        <Text
          style={styles.termsLink}
          onPress={() => void openLink("https://www.ciuna.com/terms", t("auth.termsLink", { defaultValue: "Terms" }))}
        >
          {t("auth.termsLink", { defaultValue: "Terms" })}
        </Text>
        .
      </Text>
      <View style={styles.form}>
        <SocialAuth
          appleLabel={t("auth.signUpApple", { defaultValue: "Sign up with Apple" })}
          googleLabel={t("auth.signUpGoogle", { defaultValue: "Sign up with Google" })}
          orLabel={t("auth.or", { defaultValue: "Or" })}
          onApple={() => void onSocial(signInWithApple)}
          onGoogle={() => void onSocial(signInWithGoogle)}
          disabled={busy}
        />
        {notice ? <AuthNotice tone="error" text={notice} /> : null}
        <Field
          label={t("auth.fullName", { defaultValue: "Full name" })}
          value={fullName}
          onChangeText={(v) => {
            setFullName(v)
            setNotice(null)
          }}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          placeholder={t("auth.fullNamePlaceholder", { defaultValue: "Jane Doe" })}
          returnKeyType="next"
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
          onChangeText={(v) => {
            setEmail(v)
            setNotice(null)
          }}
          returnKeyType="next"
        />
        <Field
          label={t("auth.password", { defaultValue: "Password" })}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password-new"
          textContentType="newPassword"
          placeholder={t("auth.createPasswordPlaceholder", { defaultValue: "Create a password" })}
          value={password}
          onChangeText={(v) => {
            setPassword(v)
            setNotice(null)
          }}
          returnKeyType="go"
          onSubmitEditing={() => void onSubmit()}
          trailing={<PasswordEye show={show} onToggle={() => setShow((s) => !s)} />}
        />
        <PrimaryButton
          label={
            busy
              ? t("auth.creatingAccount", { defaultValue: "Creating account…" })
              : t("auth.createAccount", { defaultValue: "Create Account" })
          }
          onPress={() => void onSubmit()}
          busy={busy}
        />
        <AuthFooter
          prompt={t("auth.alreadyHaveAccount", { defaultValue: "Already have an account?" })}
          action={t("auth.signInLink", { defaultValue: "Sign in" })}
          href="/auth/login"
        />
      </View>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 8 },
  form: { width: "100%", maxWidth: 448, alignSelf: "center" },
  terms: {
    marginBottom: 16,
    fontSize: typeSize.meta,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
  },
  termsLink: { fontWeight: "600", color: colors.primary },
})
