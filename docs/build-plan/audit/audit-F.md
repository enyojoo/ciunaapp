# Audit F: customer components vs design-system cards (mobile/)

Paths are relative to /Users/a1/Projects/ciunaapp/mobile unless noted. Read-only audit; classification MISSING / MISMATCH / OK.

## Deliberate deviations (not gaps)
- ProductCard stays the previous app card, not the Improved frame (80-decisions: revert 2026-10-16); hence `#E5E7EB` edge (token `card-edge`), shadow native-card, "Add to cart" CTA row and 32px CTA.
- ProductCard name is 1 line with fixed slots (80-decisions 2026-10-17); card README "2 lines" is stale.
- StoreCard: README "Upgrade/As built" is truth (round logo, cover, Closed chip in shade, no delivery fee/ETA line). Preview is old.
- Hub top bar: 40px back/heart/cart chips and 32px plain icons are owner decision (2026-10-17); do not flag 40px there.
- Chat: grey incoming + orange outgoing bubbles, no desktop panel/report buttons/response time (reconciliation Order chat; response-time line cut for v1). Quick replies are customer-visible (decision 9).
- Search uses app cards, not 56px rows; favourites show two-column image cards; review tab not used; no "Rate your session" variant (reconciliation).
- Checkout has no "Pay with" list (YooKassa frame); frame inline under the summary.
- Dark mode: tokens.json defines no dark palette, app.json `userInterfaceStyle: "light"`. Not a gap.
- OrderSummary "Report a problem" wording not used; link says Contact support.
- Seller-only cards (FeeBreakdown, FulfilmentChip, OrderCard, DueTimer): code path is seller/, not mobile/. No customer implementation; N/A, listed as OK-not-applicable.
- Cut for v1: seller rating on order, Popular near you, translation hint, per-area minimum.

## Per-card findings

### StoreCard (components/store-item.tsx) : mostly OK
- MISMATCH store-item.tsx:124 `rgba(17,24,39,0.35)` closed shade is a raw colour; card says greyscale cover and logo, text stays AA. Change: apply `filter`/desaturate or use `colors.text` with opacity token; keep chip.
- MISMATCH store-item.tsx:125-126 Closed chip says only "Closed"; card says "Closed · Opens 9:00" (viewer time zone). Add opens-at text if `vendor.opens_at` is in payload (decision 2 says checkout shows opening time).
- MISMATCH store-item.tsx:107 rating drawn as `★ 4.5 (n)` text, not `RatingStars`/token star colour; star glyph is un-themed. Use RatingStars size 12 or an icon in `primaryText`.
- MISSING skeleton text rows; skeleton is a bare block (store-item.tsx:128,130). Fine functionally.
- OK: 48px logo, round, verified tiers, favourite, New store, 16px radius, hairline edge.

### ProductCard (components/product-card.tsx) : deliberate old card, foundation issues remain
- MISMATCH product-card.tsx:324,334 CTA and stepper minHeight 32; stepper buttons 24px (:344) + hitSlop 6 = 36px. Card rule: 40 visual, 48 hit. Raise stepperBtn to 32 and hitSlop 8, CTA to minHeight 40.
- MISMATCH product-card.tsx:304-306 cue line is 11px in `colors.primary` (orange small text; rule: orange only on Add button; orange text must be `primaryText`). Use `colors.muted` (delivery/pickup) and keep `warningText` for low stock.
- MISMATCH product-card.tsx:284,295,304,320,321 text 9-11px (below 12). Raise noImage/catBadge/cue/vendorName to 12 minimum, vendorInitial 12.
- MISMATCH product-card.tsx:270,275,282,295,341 hard-coded `#E5E7EB`, `#F3F4F6`, `#374151`, `#FFF7ED` (tokens: card-edge, neutral-surface, neutral-text, hero-body/primary-tint). Use `colors.neutralSurface`, `colors.neutralText`, `colors.primaryTint`.
- MISSING sale/percent badge on photo and desaturated sold-out image (only CTA opacity .5, :330). Card states "sale", "sold out (desaturated)", "store closed".
- MISMATCH product-card.tsx:283 image `contentFit="contain"` on a 4:3 plate; card says photo (cover). Product decision; confirm.
- MISMATCH product-card.tsx:327 CTA radius literal 12 -> `radius.row`.

### ExpertCard (components/expert-catalog.tsx ExpertDirectoryCard, :85-138)
- MISSING headline (profession), language codes (EN RU), unavailable state ("No slots this week", Notify me), compact suggestion row. README "Upgrade" lists only photo, name, rating, price, favourite as built; from-price and next availability are built (README still says "Not built: from-price": update README).
- MISMATCH expert-catalog.tsx:296-299 hint lines 11px `colors.primary` (orange small text). Use 12px `colors.muted`/`primaryText` and say "From X".
- MISMATCH expert-catalog.tsx:96 next availability has no time-zone name (card: viewer zone name).
- MISMATCH expert-catalog.tsx:122 rating is `★` glyph text; use RatingStars. New label OK.
- MISMATCH expert-catalog.tsx:290,291,274,301,306 hard-coded `#FFFFFF`, `#F3F4F6`, `#E5E7EB` -> `colors.onPrimary`, `colors.neutralSurface`, card-edge/hairline.
- OK: verified mark with tier, favourite, equal height lines.

### ServiceCard (ExpertServiceCard, expert-catalog.tsx:140-230)
- MISSING mode chip (Online / In person · city), description, duration (only behind `showTypicalSession`), fully-booked disabled state with reason.
- MISMATCH expert-catalog.tsx:209-213 quote service shows disabled "Not bookable online"; card: "Price on request" and a secondary "Request quote" button.
- MISMATCH expert-catalog.tsx:331-337 CTA minHeight 32, text 12px; card: 48px (touch). Use PrimaryButton or minHeight 44+.
- MISMATCH expert-catalog.tsx:313,324,325,328,330 text 10-11px.
- MISMATCH expert-catalog.tsx:253 hard-coded "/ hr" not localised; PriceTag not used (card: price follows PriceTag).
- MISMATCH expert-catalog.tsx:306 `#E5E7EB` edge.

### CartLine ("app/(app)/hub/[slug]/cart.tsx", README says marketplace-checkout.tsx)
- MISMATCH cart.tsx:316-318 photo 56px (card 80), radius literal 10 (:318,:330) -> `radius.row` 12.
- MISMATCH cart.tsx:334,336 stepper and bin buttons 28px + hitSlop 8 = 44; card pill stepper 44px, bin at qty 1. Increase to 36 visual.
- MISSING problem tags (price changed, low stock with plus disabled), Remove button for sold out, vendor-lock notice card (lives in `useGuardedAdd` dialog, not a warning card). Only `rowTitleOff` line-through exists (:294).
- MISMATCH cart.tsx:147 "Add more" Pressable has no accessibilityLabel (text child, OK for SR) but role button without hint; low.
- MISMATCH cart.tsx:302,295-296 text 12-13px muted fine; `minNote` uses `primaryDeep` (== primaryText) OK.
- OK: formatMoney, tabular figures in checkout, hairline cards.

### ChatBubble ("app/orders/[id]/chat.tsx", README names components/chat-thread.tsx which does not exist)
- MISMATCH chat.tsx:470 incoming bubble `#E5E7EB` grey (reconciliation: deliberate grey); radius 18/6 literal (:469). Use token neutral-surface at least.
- MISMATCH chat.tsx:513 counter always shown; card shows it from 1,900 and error at 2,000. Gate on `count >= 1900`.
- MISMATCH chat.tsx:409 placeholder `#9CA3AF` (token `subtle` #8A8F9C).
- MISMATCH chat.tsx:474 time 11px; :511 quickChip minHeight 34 (card: chips; target 44+). Raise to 40+hit area.
- MISMATCH chat.tsx:477 Retry minHeight 32.
- MISSING system notices as separate neutral centred style (day separators exist :465; "Seen" OK :324). Offline state not drawn.
- OK: accessibilityLabel on composer and Send; 2,000 cap via CHAT_MAX; quick replies fill composer only.

### FeeBreakdown, FulfilmentChip, OrderCard, DueTimer : N/A in mobile (seller/ components). OK-not-applicable.

### FulfilmentPicker (Choice in components/marketplace-checkout.tsx:34-58, styles :1181-1200)
- MISMATCH marketplace-checkout.tsx:1181-1192 rows minHeight 48; card says 64px, with radio dot, icon, name, ETA, fee. App has text-only rows (role radio is set, good).
- MISMATCH marketplace-checkout.tsx:1195 selected fill `#FFF7ED` (token `primary-tint` is #FFF3E8; #FFF7ED is hero-body). Use `colors.primaryTint`, border `colors.primaryBorder` (card: orange border on tint) and label `colors.primaryText` not `colors.primary` (:1197).
- MISSING unavailable-option row with reason; filled radio indicator.
- MISMATCH :1184-1189 unselected row uses `paper` + hairlineWidth edge; input-edge expected for a selectable control (3:1).

### OrderSummary (SummaryCard, marketplace-checkout.tsx:82-172)
- OK: store/id/lines/service fee/delivery or pickup Free/total/payment state, slot in expert zone.
- MISMATCH :143 shows "Conversion fee" line when `corridorFee` non-zero; card rule says no FX chrome for customers. Confirm corridorFee is always 0 for marketplace.
- MISMATCH :1131 summaryLineAmount fine; total 22px, card Pay button carries total (Pay button lives in another block). Low.
- MISMATCH :1096,:1175 `errorBox` / `zoneBanner` use `#FEF2F2` literal -> `colors.dangerSurface`; zoneTitle uses `colors.danger` (text) -> `colors.dangerText`.

### OrderTimeline (components/order-timeline.tsx)
- MISMATCH order-timeline.tsx:105,119 stopped/cancelled uses destructive red dot + `colors.danger` text; card: Cancelled/Refunded are neutral dot. Use `neutralText`/`neutralSurface`.
- MISSING header (order ref + StatusBadge), actor/note per stage, meeting link / pickup code in current stage.
- MISMATCH :83 rows `accessibilityRole="text"` inside `list`; use "listitem"-equivalent grouping and add state to label ("done"/"current") so state is not colour alone for screen readers.
- MISMATCH :103-104 current dot is ring only (OK) but `colors.primary` ring vs line; fine. Done dot check 11px.
- OK: Done = success dot + check; times shown; no provider names.

### PriceTag (components/price-tag.tsx)
- MISMATCH price-tag.tsx:6-8 sizes sm 15 / md 18 / lg 22; card lg is 28. Change lg price to 28.
- MISMATCH price-tag.tsx:5 sm prefix and strike are 11px (<12). Set 12.
- MISSING percent badge (success) and free/quote words as modes; no sold-out muted mode; no tabular figures (`fontVariant: ["tabular-nums"]`).
- OK: whole amounts drop cents, strike in muted, ink price colour.

### RatingStars (components/rating-stars.tsx)
- MISMATCH rating-stars.tsx:7 `EMPTY = "#D1D5DB"` literal; token `star-empty` exists. Hoist to theme (`colors.starEmpty`).
- MISMATCH :13 aria-label is "4.5 / 5" without count; card: value, scale and count. Add `count` prop.
- MISSING number and count rendering inside component; "No reviews yet" empty-star state (RatingLine returns null :14 of reviews-section.tsx; card wants empty stars + "No reviews yet").
- OK: input mode is 48px radiogroup (:37-52), hearts filled up to rounded value.

### ReviewCard (reviews-section.tsx:47-92)
- MISSING avatar initial; seller reply lacks store name and date (:85-88).
- MISMATCH :68-69 "Verified order" always shown; card: only for reviews tied to completed order. Gate on API flag.
- MISMATCH :144 verified text uses `colors.success` (icon colour); text should be `successText`.
- MISMATCH :78 Read more hitSlop 8 + minHeight 32 = 48 OK. Clamp is char-based (200 chars) not 4-line measure; 4 lines applied only when long (:73): fine.
- OK: first name only, date, clamp at 4 lines, reply block.

### ReviewSummary (reviews-section.tsx:95-139, Distribution :25-43)
- MISMATCH :164 average 32px; card 48px.
- MISMATCH :169 bar track `#E5E7EB` -> `colors.border`/neutralSurface.
- MISSING call-to-action line states (can review, edit, cannot review with reason) in this component (exists in review-sheet.tsx / order screen); "one review" singular relies on i18n.
- OK: five rows always, counts per level.

### SlotPicker (components/slot-picker.tsx) : OK with gaps
- MISSING empty-day message pointing to the next open day (:73-75 shows generic noSlots) and muted unavailable day in the strip.
- MISMATCH :155-166 day chip 56x64 fine; border `colors.border` hairline for selectable cells (card: input-edge for controls). Low.
- OK: 48px 3-column grid, struck-through unavailable, zone line with expert zone, button names chosen time.

### VerifiedBadge (components/verified-badge.tsx)
- MISMATCH verified-badge.tsx:25 compact icon puts `accessibilityLabel` on the Lucide SVG; on native this prop is ignored. Wrap in `<View accessible accessibilityRole="image" accessibilityLabel={text}>`.
- MISMATCH :44,49 scrim `rgba(17,24,39,0.55)` literal (token scrim) and modal radius `radius.card + 4` = 20 (tokens: card 16, sheet 24). Same in confirm-dialog.tsx:53-54.
- MISSING full badge variant (success badge with icon + tier name), tooltip date/checklist (README says not built; backend).
- OK: success colour + icon, two tiers, unverified renders nothing.

### FavouriteHeart (components/favourite-heart.tsx)
- OK: 34px plate, hitSlop 7 -> 48, aria label names next action, selected state, hidden when unavailable, shadow matches `native-heart`.
- MISSING disabled/in-flight state and signed-out sign-in sheet (verify in lib/favourites; not shown here). `accessibilityState` uses `selected`; card says aria-pressed -> use `checked`/pressed semantics (`expanded` no). Low.
- MISMATCH :52 plate `rgba(255,255,255,0.94)` literal; card says white plate (`surface`).
- Plain 40px hearts in bars: deliberate (hub top bar).

### DueTimer, FulfilmentChip, OrderCard, FeeBreakdown: seller only, no customer code.

## Generic components

### Button (components/primary-button.tsx)
- MISMATCH primary-button.tsx:65 disabled opacity .45 (card 50%); :17 busy also dims (card: busy keeps full colour).
- MISMATCH :60-63 secondary border `colors.border` hairline; card: `input-edge` border.
- MISMATCH :26 `danger` renders as ghost with red text; card: destructive fill + white label. confirm-dialog.tsx:7 comment says "never a filled red" (contradicts card). Decide and update card or button.
- MISSING pressed state (primary-hover `#B8420B`), leading icon prop, web focus ring (3px). No `accessibilityState={{busy, disabled}}`.
- OK: 48px min height, 12px radius, white label on primary, sentence-case labels.

### Forms
- MISMATCH field.tsx:50 input box border `colors.border` (hairline #E8E4DC, ~1.3:1). Card/Input rule: edge uses `input-edge` (3.2:1). Switch to `colors.inputEdge`. Biggest form issue (applies to every Field).
- MISMATCH field.tsx:31 and chat.tsx:409 placeholder `#9CA3AF` -> `colors.subtle`.
- MISMATCH field.tsx:61 error text `colors.danger`, no icon; card: destructive-text + icon. Use `dangerText` + CircleAlert; set `accessibilityHint`/`aria-invalid`.
- MISSING disabled, read-only, helper text props; label not linked via `accessibilityLabelledBy`/`accessibilityLabel` (placeholders only).
- MISMATCH lib/focused-input-box.ts:6 web focus ring `rgba(249,115,22,.2)` (brand orange, 20%); card: 3px ring in `primary`. Use `rgba(205,75,14,.35)` or solid primary; border switches to primary (OK, 4.56:1).
- MISMATCH app/notifications.tsx:50 Switch off track `colors.border`; card: unchecked track `input-edge`. `thumbColor="#FFFFFF"` -> `colors.onPrimary`. Label states on-state: partial.
- MISSING web focus-visible ring on Pressable-based controls (global.css only touches input/textarea/select).
- Select/sheet picker: components/sheet-picker.tsx not audited deeply (not in assigned list).

### Feedback
- Toast (components/toast.tsx)
  - MISMATCH :8,:47 `WARNING = "#D97706"` literal; token `warning` #B45309; action text in accent colour (warning #D97706 on white about 3.2:1 fails AA; success/primary accent used as text). Use `warningText`/`successText`/`dangerText` for text, accent only for icon/bar.
  - MISMATCH :47 info toast uses orange `colors.primary`; orange is not a status. Use `colors.muted`/`ink` with Info icon.
  - MISMATCH :112,114 action and close targets 32px (+hitSlop 8 = 48 OK for close, action OK).
  - MISMATCH :75 `accessibilityLabel="Close"` hard-coded English; i18n it.
  - MISSING `accessibilityRole="alert"` / `accessibilityLiveRegion="polite"` on the toast wrapper (offline banner has it, toast does not).
  - MISMATCH :103 literal `boxShadow` instead of `shadow()` / token md; :31-42 durations 300/250 vs motion tokens fast 150 / normal 220. No reduced-motion handling anywhere (grep isReduceMotionEnabled: 0 hits).
- Banners: components/offline-banner.tsx:26 `#FFFBEB`, `#FDE68A` literals -> `colors.warningSurface` and a warning border token; bottom offset magic `88` (:15).
- Skeleton: components/inline-skeleton.tsx:55-58 `#E5E1D8`, `#DDD8CE` literals, radius 7; no token. Shimmer ignores reduced motion. Skeleton views elsewhere use `colors.paper` (ok).
- EmptyState (components/empty-state.tsx): OK structure (icon, title, sentence, one action). MISMATCH :35 `ComingSoon` hard-coded English copy; not i18n.
- Dialog (components/confirm-dialog.tsx): MISMATCH :53-54 literal scrim and radius 20 (tokens card 16 / sheet 24). MISSING focus trap and initial focus; `accessibilityRole="alert"` on card (use `dialog`/`accessibilityViewIsModal`). Destructive confirm not filled (see Button).

### Data display
- StatusChip (components/status-chip.tsx:6-12) MISMATCH: hex tones literal; fg `#047857` (success, not `successText` #065F46), `#B91C1C` (destructive, not `destructiveText` #991B1B), `#4B5563` (not `neutralText` #374151); no tone icon (card: icon + word, never colour alone); pill radius OK. Same duplicated hex in components/order-status-header.tsx:14-19.
- FilterChips (components/filter-chips.tsx:50-58) MISMATCH height 36 (<44); radius 18 literal (use `radius.pill`); text 14 OK. Same 36px at language-picker.tsx:106.
- Lists (components/list-rows.tsx): OK (76px rows, 48px thumb, 40px heart per top-bar decision).
- Tables: no DataTable in customer app. N/A.

## Foundations

### Tokens bypass: hex counts (components/ + app/, .ts/.tsx; 191 hex occurrences total)
Top 10 files: tile.tsx 9 (service-line art gradients, line :14-28; acceptable decorative but not in tokens), yookassa-checkout-widget.web.tsx 8 (provider widget theme; acceptable), home-slider.tsx 8 (:21-26 slide gradients; hero tokens exist only for orange), order-status-header.tsx 6 (:14-19 duplicated badge tones), marketplace-pay-step.tsx 6 (:303,340,387,388,398,404), auth-chrome.tsx 6 (Google logo brand colours OK; :212-213 FEF2F2/FFFBEB should be tokens), status-chip.tsx 5, send/send-recipient-step.tsx 5, product-card.tsx 5, expert-catalog.tsx 5, app/verification/index.tsx 5, bitbanker.tsx 5, app/orders/[id].tsx 5.
Most repeated values: `#FFFFFF` x17 (onPrimary/surface), `#FFFBEB` x12 (warningSurface), `#9CA3AF` x12 (placeholder/icon; not a token, use `subtle`), `#FEF2F2` x10 (dangerSurface), `#FFF7ED` x9 (hero-body; used as selected tint, should be primaryTint #FFF3E8), `#E5E7EB` x9 (card-edge), `#F3F4F6` x8, `#ECFDF5` x7, `#92400E` x7, `#047857` x7 (success as text; use successText), `#4B5563` x6.
lib/theme.ts itself: MISMATCH theme.ts:63-71 `referBgEnd`, `referBorder`, `referText`, `referIcon`, `supportBg`, `supportIcon`, `heroOrange*`, `heroAmber`, `heroBody` are literals while tokens.json has `refer-border/text/icon`, `hero-*`; theme.ts:21 default shadow colour `#0F172A` literal (tokens use rgba(15,23,42) too: OK). MISSING in theme: `radius.control`/`sheet` (tokens: control 12, sheet 24), `motion.fast/normal`, `colors.starEmpty`, `colors.cardEdge`, `colors.scrim`, `shadow` presets from tokens (xs..lg, native-heart etc.): add named presets so components stop hand-writing `shadow({opacity..})` (5 sites) and `boxShadow` (toast.tsx:103).

### Radii
147 usages go through `radius.*`; literals remain: 20 (card+4 in dialogs, chips, 17 lines), 10 (cart thumbs and stepper), 18 (chat bubble), 22, 28, 9, 7, 6, 4, 3. Off-token containers to fix: toast/dialog/verified modal 20 -> 16 or 24; cart.tsx:318,330 -> 12; filter-chips.tsx:53 and language-picker.tsx:106 -> pill; chat.tsx:469,495 (22 composer) -> pill/12.

### Touch targets under 44px (excluding hub-top-bar 40px decision)
- product-card.tsx:344 stepper 24 (+6 hit = 36), :324,334 CTA/stepper 32.
- cart.tsx:334,336 28px (+8 = 44, borderline).
- app/(app)/hub/[slug]/p/[productId].tsx:315 stepper 36.
- app/recipients/index.tsx:204 icon buttons 36 (+8 = 52 ok but no accessibilityLabel).
- app/referrals.tsx:386 copy 32 (+8 = 48 ok, no label).
- toast.tsx:112 action 32; chat.tsx:477 retry 32, :511 quick chip 34; filter-chips.tsx:51 and language-picker.tsx:106 36; app/favourites.tsx:185 tabs 40; review-sheet.tsx:314 40; marketplace-pay-step.tsx:391 40; app/profile.tsx:344 and app/support.tsx:123 32; send/send-recipient-step.tsx:212 28.
- expert-catalog.tsx:331 CTA 32.

### Text under 12px
24 occurrences in 11 files: fontSize 11 x17, 10 x2, 9 x3, 8 x1. Worst: hub-cart-header-button.tsx:75,94 (9 and 8px badge digits), product-card.tsx:295,320 (9), :284,304,321 (11), expert-catalog.tsx:299,313,324,325,328,330 (10-11), home-slider.tsx:168,170 (11 uppercase), send-amount-step.tsx:331,351, referrals.tsx:416, p/[productId].tsx:299, support/[id].tsx:169, chat.tsx:474, recipient-form-fields.tsx:271, marketplace-pay-step.tsx:360, price-tag.tsx:5 (11). Add `type.caption: 12` to theme as floor.

### Missing accessibility labels on icon-only buttons
- app/recipients/index.tsx:116 (Pencil) and :123 (Trash2): no accessibilityLabel, no role.
- app/referrals.tsx:211 (Copy/Check): no label/role.
- components/tile.tsx:72 Pressable lacks label (has text inside; OK) but role only.
- components/pay-step.tsx:72,83 Pressable wrappers around Fields: no label.
- verified-badge.tsx:25 label on SVG only (see above).
- toast.tsx:75 label hard-coded English.
All other icon buttons audited (stack-back-button, share-button, hub-cart-header-button, favourite-heart, chat send, cart steppers) have labels.

### Other foundations
- Focus: web focus rings only on text inputs (global.css), none on Pressables; ring colour is brand orange 20% not `primary` 3px.
- Contrast: orange small text drawn with `colors.primary` (4.56:1 only on white, lower on paper/tint) at product-card.tsx:306, expert-catalog.tsx:299, marketplace-checkout.tsx:1197, cart-level links `link` style (marketplace-checkout.tsx:1170); tokens say use `primaryText`.
- Dark/contrast: no dark mode by decision; AA pairs enforced in design:check for tokens, but literal hex values above bypass that check (e.g. toast #D97706).
- Motion: no reduce-motion support (0 hits); toast/skeleton/home-slider animate unconditionally.
- Font weight: `"800"` used at app/limits.tsx:116, app/receipt/[kind]/[id].tsx:215 (type scale uses 700).

## Priority list (top foundation fixes)
1. Field/Switch/Button secondary edges use hairline instead of input-edge (field.tsx:50, notifications.tsx:50, primary-button.tsx:62).
2. Status colours: status-chip.tsx, order-status-header.tsx, toast.tsx use literal hex and non-text token pairs; add icons.
3. Touch targets and 9-11px text on product/expert/cart/chat cards.
4. Web focus ring for Pressables; correct focus ring colour.
5. Add missing theme tokens (radius control/sheet, caption 12, starEmpty, scrim, cardEdge, shadow presets, motion) and replace the 191 literals.
6. Icon-only labels: recipients/index.tsx, referrals.tsx, verified-badge SVG.
7. Selected tint `#FFF7ED` -> `primaryTint` in marketplace-checkout.tsx:1195, product-card.tsx:341, marketplace-pay-step.tsx:303,340.
