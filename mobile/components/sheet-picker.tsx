import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { X } from "lucide-react-native"
import { colors, type as typeSize } from "@/lib/theme"

export function SheetPicker<T>({
  open,
  title,
  items,
  keyExtractor,
  labelExtractor,
  selectedId,
  onSelect,
  onClose,
}: {
  open: boolean
  title: string
  items: T[]
  keyExtractor: (item: T) => string
  labelExtractor: (item: T) => string
  selectedId?: string | null
  onSelect: (item: T) => void
  onClose: () => void
}) {
  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
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
                  <Text style={[styles.itemText, selected && styles.itemSelected]}>{labelExtractor(item)}</Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { maxHeight: "75%", borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.paper },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 18, fontWeight: "600", color: colors.text },
  close: { height: 44, width: 44, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  item: { minHeight: 48, justifyContent: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingVertical: 14 },
  itemText: { fontSize: typeSize.body, color: colors.text },
  itemSelected: { fontWeight: "600", color: colors.primary },
})
