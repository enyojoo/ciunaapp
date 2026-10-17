import { useState } from "react"
import { StyleSheet, View } from "react-native"
import { Redirect } from "expo-router"
import { ScreenScroll } from "@/components/screen"
import {
  Amount, AppText, Badge, Banner, Button, Card, ChipRow, Icon, IconButton, IconWell, ListGroup, ListRow, Media, NavBar,
  SectionHeader, Sheet, Skeleton, SkeletonText, StickyActionBar, SwipeRow, type IconName,
} from "@/components/ui"
import { Avatar } from "@/components/avatar"
import { haptic } from "@/lib/haptics"
import { colors, radius, space, textStyles, type TextVariant } from "@/lib/theme"

const ICON_NAMES: IconName[] = ["home", "activity", "account", "search", "gift", "heart", "cart", "share", "plus", "minus", "check", "close", "bell", "lock", "shield", "globe", "help", "bank", "clock", "send", "food", "mart", "experts", "gauge", "document", "logout", "verified", "back", "chevronLeft", "trash"]
const VARIANTS: TextVariant[] = ["largeTitle", "display", "title", "headline", "listTitle", "bodyStrong", "body", "label", "meta", "caption"]

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <SectionHeader title={title} />
      {children}
    </View>
  )
}

/** Dev only: every shared UI primitive in one place. Open with `/dev/gallery`. */
export default function Gallery() {
  const [chip, setChip] = useState("all")
  const [sheet, setSheet] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!__DEV__) return <Redirect href="/" />
  return (
    <ScreenScroll edges={["left", "right"]} contentStyle={styles.content}>
      <Block title="Type">
        {VARIANTS.map((v) => (
          <AppText key={v} variant={v} numeric={v === "display"}>
            {v === "display" ? "₽12,500" : `${v} · ${textStyles[v].fontSize}/${textStyles[v].lineHeight}`}
          </AppText>
        ))}
      </Block>

      <Block title="Buttons">
        <View style={styles.stack}>
          <Button label="Pay ₽1,100" />
          <Button label="Add to cart" variant="tinted" />
          <Button label="Add recipient" variant="secondary" />
          <Button label="Delete account" variant="destructive" />
          <Button label="Busy" busy={busy} onPress={() => { setBusy(true); setTimeout(() => setBusy(false), 1500) }} />
          <Button label="Disabled" disabled />
          <View style={styles.row}>
            <Button label="Small" size="sm" fullWidth={false} />
            <Button label="Ghost" variant="ghost" size="sm" fullWidth={false} />
            <Button label="Large" size="lg" fullWidth={false} />
          </View>
        </View>
      </Block>

      <Block title="Nav bar">
        <View style={styles.stack}>
          <View style={styles.navFrame}>
            <NavBar safeTop={false} title="Checkout" onBack={() => haptic.light()} trailing={<Icon name="share" size={20} color={colors.text} />} hairline />
          </View>
          <View style={styles.navFrame}>
            <Media uri={null} fallback="food" height={150} />
            <NavBar safeTop={false} variant="overlay" floating onBack={() => haptic.light()} trailing={<IconButton label="Save" tone="overlay" size={36}><Icon name="heart" size={17} color={colors.text} /></IconButton>} />
          </View>
        </View>
      </Block>

      <Block title="Media and avatars">
        <View style={styles.row}>
          <View style={styles.mediaCell}><Media uri={null} fallback="food" aspectRatio={4 / 3} rounded={radius.row} /></View>
          <View style={styles.mediaCell}><Media uri={null} fallback="mart" aspectRatio={4 / 3} rounded={radius.row} /></View>
          <View style={styles.mediaCell}><Media uri="https://picsum.photos/seed/ciuna/400/300" aspectRatio={4 / 3} rounded={radius.row} /></View>
        </View>
        <View style={[styles.row, { marginTop: space.md }]}>
          {["Carlos Mendes", "Dr. Amina Yusuf", "Li Wei", "Ada Obi", "Samuel Odiba"].map((n) => (
            <Avatar key={n} name={n} size={48} />
          ))}
        </View>
      </Block>

      <Block title="Swipe row (swipe left)">
        <ListGroup>
          <SwipeRow actions={[{ label: "Delete", icon: "trash", onPress: () => haptic.warning() }]}>
            <View style={styles.swipeBody}>
              <ListRow title="Suya skewers (5 pieces)" subtitle="₽450 · Qty 8" value="₽3,600" />
            </View>
          </SwipeRow>
        </ListGroup>
      </Block>

      <Block title="Chips">
        <ChipRow
          inset={0}
          value={chip}
          onChange={setChip}
          options={[{ id: "all", label: "All" }, { id: "send", label: "Transfers", count: 3 }, { id: "orders", label: "Orders" }, { id: "bookings", label: "Bookings" }]}
        />
      </Block>

      <Block title="Badges">
        <View style={styles.row}>
          <Badge label="Completed" tone="success" />
          <Badge label="In review" tone="warning" />
          <Badge label="Failed" tone="danger" />
          <Badge label="Cancelled" tone="neutral" />
          <Badge label="New" tone="primary" />
        </View>
      </Block>

      <Block title="Amount">
        <Amount value={12500} currency="RUB" size="display" />
        <Amount value={1100} currency="RUB" size="headline" />
        <Amount value={24.5} currency="USD" />
        <Amount value={450} currency="RUB" precise />
        <Amount value={10000} currency="NGN" negative />
        <Amount value={150000} currency="NGN" size="small" tone="success" />
      </Block>

      <Block title="List">
        <ListGroup title="Account">
          <ListRow leading={<IconWell><Icon name="shield" size={18} color={colors.neutralText} /></IconWell>} title="Account verification" trailing={<Badge label="Take action" />} onPress={() => {}} />
          <ListRow leading={<IconWell tone="primary"><Icon name="gauge" size={18} color={colors.primaryText} /></IconWell>} title="Limits" subtitle="No sending limit for your level" onPress={() => {}} />
          <ListRow leading={<IconWell><Icon name="globe" size={18} color={colors.neutralText} /></IconWell>} title="Language" value="English" onPress={() => {}} />
          <ListRow title="Delete account" destructive onPress={() => {}} />
        </ListGroup>
      </Block>

      <Block title="Card">
        <View style={styles.stack}>
          <Card><AppText>Flat card with a hairline edge.</AppText></Card>
          <Card elevated onPress={() => haptic.light()}><AppText>Raised card, pressable.</AppText></Card>
        </View>
      </Block>

      <Block title="Banner">
        <View style={styles.stack}>
          <Banner tone="info" title="Delivery is added at checkout" />
          <Banner tone="success" title="Transfer sent" body="Arrives today by 6:40 PM MSK." />
          <Banner tone="warning" title="Payment deadline passed" body="Start the order again to pay." />
          <Banner tone="danger" title="Couldn't load" body="Check your connection and try again." />
        </View>
      </Block>

      <Block title="Skeleton">
        <View style={styles.stack}>
          <Skeleton height={140} rounded={radius.hero} />
          <View style={styles.row}>
            <Skeleton width={48} height={48} rounded={24} />
            <View style={styles.grow}>
              <SkeletonText lines={2} />
            </View>
          </View>
        </View>
      </Block>

      <Block title="Icons">
        <View style={styles.icons}>
          {ICON_NAMES.map((n) => (
            <View key={n} style={styles.iconCell}>
              <Icon name={n} size={24} color={colors.text} />
              <AppText variant="caption" tone="muted" numberOfLines={1}>{n}</AppText>
            </View>
          ))}
        </View>
        <View style={styles.row}>
          <IconButton label="Back" onPress={() => haptic.light()}><Icon name="chevronRight" size={18} color={colors.text} /></IconButton>
          <IconButton label="Share" tone="overlay" onPress={() => haptic.light()}><Icon name="share" size={18} color={colors.text} /></IconButton>
        </View>
      </Block>

      <Block title="Haptics and sheet">
        <View style={styles.stack}>
          <View style={styles.row}>
            <Button label="Light" size="sm" variant="secondary" fullWidth={false} onPress={haptic.light} haptics={false} />
            <Button label="Select" size="sm" variant="secondary" fullWidth={false} onPress={haptic.selection} haptics={false} />
            <Button label="Success" size="sm" variant="secondary" fullWidth={false} onPress={haptic.success} haptics={false} />
            <Button label="Warning" size="sm" variant="secondary" fullWidth={false} onPress={haptic.warning} haptics={false} />
          </View>
          <Button label="Open sheet" variant="tinted" onPress={() => setSheet(true)} />
        </View>
      </Block>

      <Block title="Sticky action bar (inline preview)">
        <View style={styles.stack}>
          <StickyActionBar tabBar>
            <Button label="Checkout · ₽6,550" />
          </StickyActionBar>
          <StickyActionBar tabBar hint="Pick a time to continue">
            <Button label="Continue" disabled />
          </StickyActionBar>
        </View>
      </Block>

      <Sheet open={sheet} title="Delivery area" onClose={() => setSheet(false)} footer={<Button label="Done" onPress={() => setSheet(false)} />}>
        <ListGroup>
          <ListRow title="Moscow · Tverskoy" value="₽150" />
          <ListRow title="Moscow · Arbat" value="₽150" />
          <ListRow title="Moscow · Khamovniki" value="₽200" />
        </ListGroup>
      </Sheet>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter, paddingTop: space.lg },
  block: { marginBottom: space.xl },
  stack: { gap: space.md },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm },
  grow: { flex: 1 },
  icons: { flexDirection: "row", flexWrap: "wrap", marginBottom: space.md },
  iconCell: { width: "25%", alignItems: "center", gap: 4, paddingVertical: space.sm },
  navFrame: { borderRadius: radius.card, overflow: "hidden", backgroundColor: colors.paper, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  mediaCell: { width: "31%" },
  swipeBody: { backgroundColor: colors.surface },
})
