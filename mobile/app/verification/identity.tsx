import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { useNavigation, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react-native"
import { KycDocumentUploadFrame } from "@/components/kyc-document-upload-frame"
import type { KycPickedDocument } from "@/lib/kyc-document-file"
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
  const [image, setImage] = useState<KycPickedDocument | null>(null)
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

      <KycDocumentUploadFrame
        emptyTitle={t("verification.uploadIdTitle")}
        value={image}
        onChange={setImage}
      />

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
  submitWrap: { marginTop: 28 },
})
