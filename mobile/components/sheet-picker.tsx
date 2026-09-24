import type { ReactNode } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { X } from "lucide-react-native"
import { WebAwareModal } from "@/components/web-aware-modal"
import { useWebCenteredModal } from "@/lib/web-centered-modal"
import { colors, type as typeSize } from "@/lib/theme"

export function SheetPicker<T>({
  open,
  title,
  items,
  keyExtractor,
  labelExtractor,
  leadingExtractor,
  selectedId,
  onSelect,
  onClose,
}: {
  open: boolean
  title: string
  items: T[]
  keyExtractor: (item: T) => string
  labelExtractor: (item: T) => string
  /** Optional leading element (e.g. a flag) rendered before the label. */
  leadingExtractor?: (item: T) => ReactNode
  selectedId?: string | null
  onSelect: (item: T) => void
  onClose: () => void
}) {
  const dialog = useWebCenteredModal()

  return (
    <WebAwareModal visible={open} onRequestClose={onClose}>
      <SafeAreaView edges={dialog ? [] : ["bottom"]}>
        <View style={styles.head}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} style={styles.close} accessibilityLabel="Close">
            <X size={20} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          {items.map((item) => {
            const id = keyExtractor(item)
            const selected = selectedId === id
            return (
              <Pressable
                key={id}
                onPress={() => {
                  onSelect(item)
                  onClose()
                }}
                style={styles.item}
              >
                {leadingExtractor ? <View style={styles.leadingSlot}>{leadingExtractor(item)}</View> : null}
                <Text style={[styles.itemText, selected && styles.itemSelected]} numberOfLines={1}>
                  {labelExtractor(item)}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </SafeAreaView>
    </WebAwareModal>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 18, fontWeight: "600", color: colors.text },
  close: { height: 44, width: 44, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  item: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  /** Same as {@link CountryPicker} rows — natural flag width, no clipping. */
  leadingSlot: { flexShrink: 0 },
  itemText: { flex: 1, minWidth: 0, fontSize: typeSize.body, color: colors.text },
  itemSelected: { fontWeight: "600", color: colors.primary },
})
