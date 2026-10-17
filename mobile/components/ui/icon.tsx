import { Platform, type ColorValue } from "react-native"
import { SymbolView, type SFSymbol } from "expo-symbols"
import {
  ArrowLeft, BadgeCheck, Bell, Briefcase, Candy, Cookie, CupSoda, Droplets, Flame, Footprints, Smartphone, Snowflake, Soup, Sunrise, Wheat, ChevronLeft, Check, ChevronRight, Clock, CircleHelp, FileText, Gauge, Gift, Globe, GraduationCap, Heart, History, House,
  Landmark, Languages, Laptop, Lock, LogOut, Minus, Plus, Scissors, Search, Send, Share2, Sparkles, ShieldCheck, ShoppingBasket, ShoppingCart, Trash2, User, UtensilsCrossed, X,
  type LucideIcon,
} from "lucide-react-native"

type Entry = { sf: SFSymbol; sfFilled?: SFSymbol; lucide: LucideIcon }

/** One icon vocabulary. SF Symbols on iOS, Lucide on Android and web. Add names here, never import a glyph in a screen. */
const ICONS = {
  home: { sf: "house", sfFilled: "house.fill", lucide: House },
  activity: { sf: "clock.arrow.circlepath", lucide: History },
  account: { sf: "person", sfFilled: "person.fill", lucide: User },
  search: { sf: "magnifyingglass", lucide: Search },
  gift: { sf: "gift", sfFilled: "gift.fill", lucide: Gift },
  heart: { sf: "heart", sfFilled: "heart.fill", lucide: Heart },
  cart: { sf: "cart", sfFilled: "cart.fill", lucide: ShoppingCart },
  share: { sf: "square.and.arrow.up", lucide: Share2 },
  chevronRight: { sf: "chevron.right", lucide: ChevronRight },
  chevronLeft: { sf: "chevron.left", lucide: ChevronLeft },
  /** Back in a nav bar: chevron on iOS, Material arrow on Android and web. */
  back: { sf: "chevron.left", lucide: ArrowLeft },
  plus: { sf: "plus", lucide: Plus },
  minus: { sf: "minus", lucide: Minus },
  check: { sf: "checkmark", lucide: Check },
  close: { sf: "xmark", lucide: X },
  trash: { sf: "trash", sfFilled: "trash.fill", lucide: Trash2 },
  bell: { sf: "bell", sfFilled: "bell.fill", lucide: Bell },
  lock: { sf: "lock", sfFilled: "lock.fill", lucide: Lock },
  shield: { sf: "checkmark.shield", sfFilled: "checkmark.shield.fill", lucide: ShieldCheck },
  globe: { sf: "globe", lucide: Globe },
  help: { sf: "questionmark.circle", lucide: CircleHelp },
  bank: { sf: "building.columns", lucide: Landmark },
  clock: { sf: "clock", lucide: Clock },
  send: { sf: "paperplane", sfFilled: "paperplane.fill", lucide: Send },
  food: { sf: "fork.knife", lucide: UtensilsCrossed },
  mart: { sf: "basket", sfFilled: "basket.fill", lucide: ShoppingBasket },
  experts: { sf: "graduationcap", sfFilled: "graduationcap.fill", lucide: GraduationCap },
  gauge: { sf: "gauge.with.dots.needle.50percent", lucide: Gauge },
  document: { sf: "doc.text", lucide: FileText },
  logout: { sf: "rectangle.portrait.and.arrow.right", lucide: LogOut },
  verified: { sf: "checkmark.seal.fill", lucide: BadgeCheck },
  briefcase: { sf: "briefcase", sfFilled: "briefcase.fill", lucide: Briefcase },
  scissors: { sf: "scissors", lucide: Scissors },
  laptop: { sf: "laptopcomputer", lucide: Laptop },
  translate: { sf: "character.bubble", sfFilled: "character.bubble.fill", lucide: Languages },
  sparkles: { sf: "sparkles", lucide: Sparkles },
  /** Someone on the move (errands). Lucide has no walking figure, so Android and web show footprints. */
  walk: { sf: "figure.walk", lucide: Footprints },
  // Food meal types and Mart aisles.
  soup: { sf: "cup.and.heat.waves", lucide: Soup },
  flame: { sf: "flame", sfFilled: "flame.fill", lucide: Flame },
  pastry: { sf: "takeoutbag.and.cup.and.straw", lucide: Cookie },
  sunrise: { sf: "sunrise", lucide: Sunrise },
  drink: { sf: "cup.and.saucer", lucide: CupSoda },
  grain: { sf: "bag", lucide: Wheat },
  sauce: { sf: "drop", lucide: Droplets },
  sweets: { sf: "birthday.cake", lucide: Candy },
  frozen: { sf: "snowflake", lucide: Snowflake },
  phone: { sf: "iphone", lucide: Smartphone },
} as const satisfies Record<string, Entry>

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  size = 22,
  color,
  filled,
  strokeWidth = 2,
}: {
  name: IconName
  size?: number
  color: ColorValue
  /** Filled variant where one exists (active tab, saved heart). */
  filled?: boolean
  strokeWidth?: number
}) {
  const entry: Entry = ICONS[name]
  const Fallback = entry.lucide
  const lucide = <Fallback size={size} color={color as string} strokeWidth={strokeWidth} fill={filled && name === "heart" ? (color as string) : "none"} />
  if (Platform.OS !== "ios") return lucide
  return (
    <SymbolView
      name={filled && entry.sfFilled ? entry.sfFilled : entry.sf}
      size={size}
      tintColor={color}
      weight="medium"
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
      fallback={lucide}
    />
  )
}
