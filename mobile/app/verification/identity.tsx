import { useEffect, useState } from "react"
import * as ImagePicker from "expo-image-picker"
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native"
import { useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Camera, ChevronDown, Images } from "lucide-react-native"
import { CountryPicker } from "@/components/country-picker"
import { FlagIcon } from "@/components/flag-icon"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { SheetPicker } from "@/components/sheet-picker"
import { useToast } from "@/components/toast-provider"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { countryService, type Country } from "@/lib/country-service"
import { getIdTypeLabel, getIdTypesForCountry } from "@/lib/country-id-types"
import { useKycSubmissions } from "@/lib/use-kyc-submissions"
import { colors, radius, type as typeSize } from "@/lib/theme"

export default function IdentityVerificationScreen() {
  const { t } = useTranslation("app")
  const navigation = useNavigation()
  const router = useRouter()
  const { user } = useAuth()
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    navigation.setOptions({ title: t("verification.identityPageTitle") })
  }, [navigation, t])

  const [countries, setCountries] = useState<Country[]>([])
  const { data: submissions, loading, revalidate } = useKycSubmissions(user?.id)
  const submission = (submissions || []).find((row) => row.type === "identity") || null
  const [countryOpen, setCountryOpen] = useState(false)
  const [idTypeOpen, setIdTypeOpen] = useState(false)
  const [country, setCountry] = useState<Country | null>(null)
  const [idType, setIdType] = useState<string | null>(null)
  const [image, setImage] = useState<{ uri: string; name: string; type: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void countryService.getAll().then(setCountries)
  }, [])

  useEffect(() => {
    if (submission?.country_code) setCountry({ code: submission.country_code, name: submission.country_code, flag_emoji: "" })
    if (submission?.id_type) setIdType(submission.id_type)
  }, [submission])

  const idTypes = country ? getIdTypesForCountry(country.code) : []
  const locked = submission?.status === "in_review" || submission?.status === "approved"

  const pick = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 })
    if (result.canceled) return
    const asset = result.assets[0]
    if (!asset) return
    const name = asset.fileName || `identity_${Date.now()}.jpg`
    setImage({ uri: asset.uri, name, type: asset.mimeType || "image/jpeg" })
  }

  const submit = async () => {
    if (!country || !idType || !image) {
      showError(t("verification.fillAllFields"))
      return
    }
    setSubmitting(true)
    try {
      const { data } = await supabase.auth.getSession()
      const form = new FormData()
      form.append("type", "identity")
      form.append("country_code", country.code)
      form.append("id_type", idType)
      form.append("file", { uri: image.uri, name: image.name, type: image.type } as unknown as Blob)
      const res = await fetch(apiUrl("/api/kyc/submissions"), {
        method: "POST",
        headers: data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : undefined,
        body: form,
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        showError((body as { error?: string }).error || t("verification.uploadFailed"))
        return
      }
      showSuccess(t("verification.submit"))
      revalidate()
      router.back()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenScroll>
    )
  }

  if (locked) {
    return (
      <ScreenScroll edges={["left", "right"]}>
        <View style={styles.lockedBox}>
          <Text style={styles.lockedText}>
            {submission?.status === "approved"
              ? t("kyc.verified", { ns: "common" })
              : t("verification.identityInReview")}
          </Text>
        </View>
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll edges={["left", "right"]} keyboard>
      {submission?.status === "rejected" ? (
        <View style={styles.rejectBox}>
          <Text style={styles.rejectTitle}>{t("verification.badgeRejected")}</Text>
          {submission.rejection_reason ? <Text style={styles.rejectNote}>{submission.rejection_reason}</Text> : null}
        </View>
      ) : null}

      <Text style={styles.label}>{t("verification.labelCountry")}</Text>
      <Pressable onPress={() => setCountryOpen(true)} style={styles.selectBox}>
        <View style={styles.selectValue}>
          {country ? <FlagIcon code={country.code} size={18} /> : null}
          <Text style={styles.selectText}>
            {country ? country.name : t("verification.placeholderSelectCountry")}
          </Text>
        </View>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>

      <Text style={styles.label}>{t("verification.labelIdType")}</Text>
      <Pressable
        onPress={() => country && setIdTypeOpen(true)}
        style={[styles.selectBox, !country && styles.selectBoxDisabled]}
      >
        <Text style={styles.selectText}>
          {idType ? getIdTypeLabel(idType) : t("verification.placeholderSelectIdType")}
        </Text>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>

      <Text style={styles.label}>{t("verification.labelIdDocument")}</Text>
      {image ? (
        <Pressable onPress={() => void pick(false)}>
          <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
          <Text style={styles.retake}>{t("verification.clickToTryAgain")}</Text>
        </Pressable>
      ) : (
        <View style={styles.uploadRow}>
          <Pressable style={styles.uploadBtn} onPress={() => void pick(true)}>
            <Camera size={20} color={colors.primary} strokeWidth={2} />
            <Text style={styles.uploadBtnText}>{t("verification.uploadIdTitle")}</Text>
          </Pressable>
          <Pressable style={styles.uploadBtn} onPress={() => void pick(false)}>
            <Images size={20} color={colors.primary} strokeWidth={2} />
            <Text style={styles.uploadBtnText}>{t("verification.fileHint")}</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.submitWrap}>
        <PrimaryButton
          label={submission ? t("verification.updateSubmission") : t("verification.submit")}
          busy={submitting}
          onPress={() => void submit()}
        />
      </View>

      <CountryPicker
        open={countryOpen}
        title={t("verification.labelCountry")}
        searchPlaceholder={t("verification.searchCountries")}
        countries={countries}
        selectedCode={country?.code}
        onSelect={(c) => {
          setCountry(c)
          setIdType(null)
        }}
        onClose={() => setCountryOpen(false)}
      />
      <SheetPicker
        open={idTypeOpen}
        title={t("verification.labelIdType")}
        items={idTypes}
        keyExtractor={(id) => id}
        labelExtractor={(id) => getIdTypeLabel(id)}
        selectedId={idType}
        onSelect={setIdType}
        onClose={() => setIdTypeOpen(false)}
      />
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  center: { paddingVertical: 80, alignItems: "center" },
  lockedBox: { marginTop: 40, alignItems: "center", paddingHorizontal: 24 },
  lockedText: { fontSize: 17, fontWeight: "600", color: colors.text, textAlign: "center" },
  rejectBox: {
    marginBottom: 20,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    padding: 14,
  },
  rejectTitle: { fontSize: typeSize.body, fontWeight: "700", color: "#B91C1C" },
  rejectNote: { marginTop: 4, fontSize: typeSize.meta, color: "#991B1B" },
  label: { marginBottom: 8, marginTop: 16, fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  selectBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  selectBoxDisabled: { opacity: 0.5 },
  selectValue: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  selectText: { fontSize: typeSize.body, color: colors.text },
  uploadRow: { flexDirection: "row", gap: 12 },
  uploadBtn: {
    flex: 1,
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  uploadBtnText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.primary, textAlign: "center", paddingHorizontal: 8 },
  preview: { width: "100%", height: 200, borderRadius: radius.card, backgroundColor: colors.paper },
  retake: { marginTop: 8, textAlign: "center", fontSize: typeSize.meta, fontWeight: "600", color: colors.primary },
  submitWrap: { marginTop: 28 },
})
