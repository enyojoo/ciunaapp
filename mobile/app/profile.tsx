import { useEffect, useMemo, useState } from "react"
import * as ImagePicker from "expo-image-picker"
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Camera, Image as ImageIcon, Pencil, Trash2 } from "lucide-react-native"
import { Avatar } from "@/components/avatar"
import { Field } from "@/components/field"
import { GroupCard } from "@/components/row"
import { PrimaryButton } from "@/components/primary-button"
import { ScreenScroll } from "@/components/screen"
import { CurrencyFlag } from "@/components/currency-flag"
import { SheetPicker } from "@/components/sheet-picker"
import { useToast } from "@/components/toast-provider"
import { useAuth } from "@/lib/auth-context"
import { removeProfileAvatar, uploadProfileAvatar } from "@/lib/profile-avatar-upload"
import { useFx } from "@/lib/use-fx"
import { supabase } from "@/lib/supabase"
import { colors, radius, type as typeSize, ui } from "@/lib/theme"
import type { CurrencyRow } from "@/lib/types"

export default function ProfileScreen() {
  const { t } = useTranslation("app")
  const { profile, refreshProfile } = useAuth()
  const { currencies } = useFx()
  const { showError, showSuccess } = useToast()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [baseCurrency, setBaseCurrency] = useState("USD")
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarRemoving, setAvatarRemoving] = useState(false)
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false)
  const hasPhoto = Boolean(profile?.avatar_url)

  useEffect(() => {
    setFirstName(profile?.first_name || "")
    setLastName(profile?.last_name || "")
    setPhone(profile?.phone || "")
    setBaseCurrency(profile?.base_currency || "USD")
  }, [profile])

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || t("profile.notSet")
  const selectedCurrency = useMemo(
    () => currencies.find((c) => c.code === baseCurrency),
    [currencies, baseCurrency],
  )

  const cancelEdit = () => {
    setFirstName(profile?.first_name || "")
    setLastName(profile?.last_name || "")
    setPhone(profile?.phone || "")
    setBaseCurrency(profile?.base_currency || "USD")
    setEditing(false)
  }

  const save = async () => {
    if (!profile?.id) return
    setSaving(true)
    const { error } = await supabase
      .from("users")
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        base_currency: baseCurrency,
      })
      .eq("id", profile.id)
    setSaving(false)
    if (error) {
      showError(t("errors.generic", { defaultValue: "Something went wrong. Please try again." }))
      return
    }
    await refreshProfile()
    showSuccess(t("profile.save"))
    setEditing(false)
  }

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    setAvatarUploading(true)
    try {
      const result = await uploadProfileAvatar({
        uri: asset.uri,
        name: asset.fileName,
        mimeType: asset.mimeType,
      })
      if ("error" in result) {
        showError(result.error)
        return
      }
      await refreshProfile()
    } catch {
      showError(t("errors.generic", { defaultValue: "Something went wrong. Please try again." }))
    } finally {
      setAvatarUploading(false)
    }
  }

  const pickAvatar = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        })
    if (result.canceled) return
    const asset = result.assets[0]
    if (asset) void uploadAvatar(asset)
  }

  type PhotoAction = { id: "camera" | "library" | "remove"; label: string; icon: typeof Camera; destructive?: boolean }
  const photoActions: PhotoAction[] = [
    { id: "camera", label: t("profile.takePhoto", { defaultValue: "Take Photo" }), icon: Camera },
    { id: "library", label: t("profile.chooseFromLibrary", { defaultValue: "Choose from Library" }), icon: ImageIcon },
    ...(hasPhoto
      ? [{ id: "remove" as const, label: t("profile.removePhoto", { defaultValue: "Remove photo" }), icon: Trash2, destructive: true }]
      : []),
  ]

  const handlePhotoAction = (action: PhotoAction) => {
    if (action.id === "camera") void pickAvatar(true)
    else if (action.id === "library") void pickAvatar(false)
    else confirmRemoveAvatar()
  }

  const removeAvatar = async () => {
    setAvatarRemoving(true)
    try {
      const result = await removeProfileAvatar()
      if ("error" in result) {
        showError(result.error)
        return
      }
      await refreshProfile()
    } catch {
      showError(t("errors.generic", { defaultValue: "Something went wrong. Please try again." }))
    } finally {
      setAvatarRemoving(false)
    }
  }

  const confirmRemoveAvatar = () => {
    Alert.alert(t("profile.removePhoto", { defaultValue: "Remove photo" }), t("profile.removePhotoConfirm", { defaultValue: "Remove your profile photo?" }), [
      { text: t("profile.cancel"), style: "cancel" },
      {
        text: t("profile.removePhoto", { defaultValue: "Remove photo" }),
        style: "destructive",
        onPress: () => void removeAvatar(),
      },
    ])
  }

  const confirmDelete = () => {
    Alert.alert(t("profile.deleteTitle"), t("profile.deleteDescription"), [
      { text: t("profile.cancel"), style: "cancel" },
      {
        text: t("profile.deleteAccount"),
        style: "destructive",
        onPress: () => showError(t("profile.deleteNotImplemented")),
      },
    ])
  }

  return (
    <ScreenScroll edges={["left", "right"]}>
      <View style={styles.identity}>
        <View style={styles.avatarWrap}>
          <Pressable
            onPress={() => setPhotoSheetOpen(true)}
            disabled={avatarUploading || avatarRemoving}
            accessibilityRole="button"
            accessibilityLabel={t("profile.changePhoto", { defaultValue: "Change photo" })}
          >
            <Avatar name={name} size={72} uri={profile?.avatar_url} />
            <View style={styles.avatarBadge}>
              {avatarUploading || avatarRemoving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Camera size={14} color="#fff" strokeWidth={2.4} />
              )}
            </View>
          </Pressable>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{t("profile.profileInfo")}</Text>
        {!editing ? (
          <Pressable onPress={() => setEditing(true)} style={styles.editBtn} hitSlop={8}>
            <Pencil size={14} color={colors.primary} strokeWidth={2.2} />
            <Text style={styles.editBtnText}>{t("profile.edit")}</Text>
          </Pressable>
        ) : null}
      </View>

      <GroupCard>
        {editing ? (
          <View style={styles.form}>
            <Field label={t("profile.firstName")} value={firstName} onChangeText={setFirstName} editable={!saving} />
            <Field label={t("profile.lastName")} value={lastName} onChangeText={setLastName} editable={!saving} />
            <Field
              label={t("profile.phone")}
              value={phone}
              onChangeText={setPhone}
              editable={!saving}
              keyboardType="phone-pad"
            />
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>{t("profile.baseCurrency")}</Text>
              <Pressable
                onPress={() => setCurrencyPickerOpen(true)}
                style={styles.currencyBox}
                disabled={saving}
              >
                <CurrencyFlag
                  code={selectedCurrency?.code || baseCurrency}
                  flagSvg={selectedCurrency?.flag_svg}
                  size={20}
                />
                <Text style={styles.currencyText}>{selectedCurrency?.code || baseCurrency}</Text>
              </Pressable>
              <Text style={styles.hint}>{t("profile.baseCurrencyHint")}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <InfoRow label={t("profile.firstName")} value={profile?.first_name || t("profile.notSet")} />
            <InfoRow label={t("profile.lastName")} value={profile?.last_name || t("profile.notSet")} />
            <InfoRow label={t("profile.email")} value={profile?.email || ""} />
            <InfoRow label={t("profile.phone")} value={profile?.phone || t("profile.notSet")} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("profile.baseCurrency")}</Text>
              <View style={styles.currencyDisplay}>
                <CurrencyFlag
                  code={selectedCurrency?.code || baseCurrency}
                  flagSvg={selectedCurrency?.flag_svg}
                  size={20}
                />
                <Text style={styles.infoValue}>{selectedCurrency?.code || baseCurrency}</Text>
              </View>
            </View>
          </View>
        )}
      </GroupCard>

      {editing ? (
        <View style={styles.actions}>
          <View style={styles.actionHalf}>
            <PrimaryButton label={t("profile.discard")} variant="secondary" onPress={cancelEdit} disabled={saving} />
          </View>
          <View style={styles.actionHalf}>
            <PrimaryButton label={saving ? t("profile.saving") : t("profile.save")} onPress={() => void save()} busy={saving} />
          </View>
        </View>
      ) : (
        <Pressable onPress={confirmDelete} style={styles.deleteRow}>
          <Text style={styles.deleteText}>{t("profile.deleteAccount")}</Text>
        </Pressable>
      )}

      <SheetPicker<CurrencyRow>
        open={currencyPickerOpen}
        title={t("profile.selectBaseCurrency")}
        items={currencies}
        keyExtractor={(c) => c.code}
        labelExtractor={(c) => `${c.code}${c.name ? ` — ${c.name}` : ""}`}
        leadingExtractor={(c) => <CurrencyFlag code={c.code} flagSvg={c.flag_svg} size={20} />}
        selectedId={baseCurrency}
        onSelect={(c) => setBaseCurrency(c.code)}
        onClose={() => setCurrencyPickerOpen(false)}
      />

      <SheetPicker<PhotoAction>
        open={photoSheetOpen}
        title={t("profile.changePhoto", { defaultValue: "Change photo" })}
        items={photoActions}
        keyExtractor={(a) => a.id}
        labelExtractor={(a) => a.label}
        leadingExtractor={(action) => {
          const Icon = action.icon
          return <Icon size={18} color={action.destructive ? colors.danger : colors.text} strokeWidth={2} />
        }}
        onSelect={handlePhotoAction}
        onClose={() => setPhotoSheetOpen(false)}
      />
    </ScreenScroll>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  identity: { alignItems: "center", gap: 8, paddingTop: 8, marginBottom: 24 },
  avatarWrap: { position: "relative" },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.paper,
  },
  name: { fontSize: 19, fontWeight: "700", color: colors.text },
  email: { fontSize: typeSize.meta, color: colors.muted },
  cardHead: { marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 17, fontWeight: "600", color: colors.text },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 32, paddingHorizontal: 4 },
  editBtnText: { fontSize: typeSize.meta, fontWeight: "600", color: colors.primary },
  form: { paddingVertical: 4, gap: 4 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { marginBottom: 8, fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  currencyBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  currencyText: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  hint: { marginTop: 6, fontSize: 12, color: colors.muted },
  infoRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  infoLabel: { fontSize: typeSize.meta, color: colors.muted },
  infoValue: { flexShrink: 1, marginLeft: 12, fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  currencyDisplay: { flexDirection: "row", alignItems: "center", gap: 8 },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
  actionHalf: { flex: 1 },
  deleteRow: { marginTop: 28, alignItems: "center", minHeight: 44, justifyContent: "center" },
  deleteText: { fontSize: typeSize.body, fontWeight: "600", color: colors.danger },
})
