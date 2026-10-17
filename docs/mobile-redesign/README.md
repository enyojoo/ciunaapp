# Mobile redesign: review and plan

Scope: Expo app only (iOS first, Android parity). The review is based on the baseline screenshots in [`baseline/`](baseline/), taken in the iOS Simulator on Oct 17, 2026, and on the current code in `mobile/`.

The goal is for Ciuna to feel like a native super app, on par with Revolut, Uber Eats, Glovo, Wise and Airbnb, and not like a web app in a native shell.

---

## 1. The verdict in one paragraph

The product structure is right: four engines, one activity list, an Account tab. The data is real and the flows work. What holds it back is presentation. **Every screen uses the same white, bordered, rounded card on paper, the same 17–20pt type, and the same burnt-orange pill for everything** (filters, CTAs, featured tiles, hearts, the cart icon). That gives the app no hierarchy, low density, and a "web form" feel. The chrome is web chrome too: a tall white header with a circled back button and a hairline on every screen, the tab bar showing inside checkout, and pickers built as lists of large buttons instead of sheets. Fixing the system-level patterns once (chrome, type scale, colour discipline, media, sheets, motion) will lift every screen. Then each feature needs a native layout of its own.

---

## 2. System-level problems (they affect every screen)

| # | Problem | Seen in | Fix |
|---|---|---|---|
| S1 | **Web-style header on every stack screen.** It is 88pt tall and white, with a bordered circle back button, a subtitle and a hairline, so it eats about 15% of the screen. | Food, Cart, Checkout, Transfer, Order, Support | Use the native stack header: an iOS large title that collapses on scroll, the system back chevron and swipe-back. On media screens (store, product, expert) make the header **transparent over the image** and fade it in on scroll. |
| S2 | **The tab bar shows inside commerce flows.** It sits under the cart CTA and the product page and competes with the primary action. | Store, Product, Cart | Tabs appear only on the three root screens. Food/Mart/Experts/Send flows push over the tabs. Cart and product open as sheets. |
| S3 | **Orange is used for everything,** so nothing stands out. Selected filter chips, every "Book a session" button, the featured expert tiles (solid orange with a letter), hearts and the cart icon are all orange. | Food, Experts, Activities | Orange is kept for **one primary action per screen** and the brand mark. Selection uses an ink fill (`#111827`) with a white label. Hearts are ink outlines and red when filled. Status uses semantic colours. |
| S4 | **The type scale is flat and too large.** Body text is about 17–18pt, list titles 20pt, section titles 22pt, so levels barely differ. Density is low: Home shows four tiles in one screen. | All | Body 15, secondary 13, list title 16/600, section 20/700, screen large title 32/700, money display 40–48 with tabular figures. Use weight and colour for hierarchy, not size alone. |
| S5 | **Cards inside cards.** Each section is a bordered white box, and boxes hold more boxes (checkout delivery areas, cart lines). | Checkout, Cart, Store, Expert, Account | Use **inset grouped lists** (iOS Settings style) for data and settings, and whitespace plus section headers for structure. Cards are only for tappable *objects* (a store, a product, an expert). |
| S6 | **Missing media looks broken.** It shows "No image" text, an orange gradient as store cover, and orange letter squares for experts. | Food, Store, Product, Experts | Use designed fallbacks: a neutral tinted tile with the category glyph, a monogram on a soft per-name hue for people, `expo-image` with blurhash and a cross-fade. Ask office for real covers (see decisions). |
| S7 | **Pickers are inline lists, not sheets.** Delivery area is four full-width buttons, and Language is a dropdown inside a row. | Checkout, Account | Use a native form sheet (`presentation: "formSheet"` with detents) for every choice: area, address, currency, recipient, payment method, language, filters. |
| S8 | **Disabled CTAs** are a faded orange with a white label, which is low contrast and gives no reason. | Send, Book slot | Disabled = neutral fill with a muted label, and a one-line reason above the bar ("Pick a time", "Enter an amount"). |
| S9 | **Nothing moves.** There is no press feedback, haptics, list transitions or shared elements. | All | Press scale (0.97) and light haptics on all tappables, success haptics on pay/send, layout animations for add-to-cart, a skeleton → content cross-fade, and native push/sheet transitions. The `PressableScale` and `haptics.ts` already in progress cover the base. |
| S10 | **Lists aren't native.** There is no pull to refresh, no swipe actions, and long lists use `ScrollView`/`map`. | Activities, Cart, Favourites | `FlashList`, pull to refresh on every root list, swipe to delete in Cart, Favourites and Recipients. |
| S11 | **Naming drifts.** The Account tab opens a screen titled "More". "Transfer" on Home vs "Send" in DESIGN.md. "Activities" vs "Transactions". | Account, Home | One name per thing in every locale. Update DESIGN.md §2 to match what ships (Activities, Account). |

---

## 3. Screen-by-screen review

### Home (`app/(app)/hub/index.tsx`), baseline 01b
- **Bug:** a large empty gap sits between the two tile rows. The grid is sized to the screen and doesn't flow with its content.
- The hero carousel takes the best real estate with generic copy ("Home is wherever you are"). It tells a returning user nothing.
- Nothing is personal. A pending payment, an order on its way, a "send again" and a KYC nudge all live elsewhere.
- **Redesign:** compact header (logo, search field entry, avatar). A **"Now" card** if anything needs action (awaiting payment, order arriving, booking today). Service tiles in a compact 2-col grid with real office artwork, about 96pt tall and not 160. **Send again** (recent recipients as avatars). Rails: *Popular near you* (stores), *Top experts*. The promo banner moves below the fold and gets smaller. The in-progress `components/home/*` (now-card, send-again) is the right direction.

### Food / Mart catalog (`hub/[slug]/index.tsx`), baseline 02, 08
- The header subtitle ("Have all your cravings") wastes 60pt.
- Store cards: an orange gradient cover, "New store" as the only meta, and no fee, time or rating.
- **Product cards show no price.** They show "Pickup" in orange and the vendor instead, so the most important number is missing.
- **Redesign:** a large title, then a sticky search and **delivery/pickup + address** selector (Glovo pattern). A category row with icons, not text pills. Store cards with a cover, a logo badge and the meta line `★4.8 · 25–35 min · ₽150`. Product cards image first, with **price bold**, the vendor in muted text and a round **+ quick-add** button that turns into a stepper once added.

### Storefront (`hub/[slug]/v/[vendor].tsx`), baseline 03–04
- The logo overlap is misaligned (it is clipped by the cover's bottom-left radius). "Local foodstuffs" sits alone in a card, and pickup info is a card too.
- **Redesign:** a full-bleed cover with a transparent header (back, share, heart as blurred circles). Below it the name, a meta row (rating · time · fee · Open until 20:00) and a tappable "Pickup at Pyatnitskaya St 25 ›" info row. **Sticky category tabs with scroll-spy.** **Menu rows** (title, 2-line description, price, thumbnail on the right with a + button), which is the Uber Eats/Wolt pattern and denser than a 2-col grid for food. A floating **cart bar** ("3 items · ₽6,550 · View cart") above the home indicator.

### Product (`hub/[slug]/p/[productId].tsx`), baseline 05
- "No image" fills half the screen. Price, stock, pickup and vendor are scattered. The CTA scrolls away, and the tab bar is visible.
- **Redesign:** open as a **sheet** from the store, with a full-bleed image, title, price, description, options or notes and a qty stepper, plus a **sticky "Add 2 · ₽660"** bar. Mart items with galleries keep a full page with the same sticky bar.

### Cart (`hub/[slug]/cart.tsx`), baseline 06
- **Bug:** line totals are clipped ("₽2,95…") because the title and total compete on one line.
- Subtotal and Total show the same number. The red trash icon on every line is alarming.
- **Redesign:** a sheet over the store. Compact rows (thumbnail 56, title, unit price, inline stepper, total right-aligned below). Going to 0 removes the line, and swipe deletes. A single summary row. Sticky "Go to checkout · ₽6,550".

### Checkout (`components/marketplace-checkout.tsx`), baseline 07
- The two-step bar adds ceremony. Delivery areas are four big buttons, and the address textarea is below the fold. There is no sticky pay bar.
- **Redesign:** **one-page checkout** with tappable rows that open sheets: *Delivery to* (area + address), *Contact*, *Pay with* (method logos), *Order* (collapsed items) and a *Summary* (subtotal, delivery, service fee, total). A sticky **"Pay ₽6,700"** button. A success screen with an animated check and haptic, then the order page.

### Send (`app/send.tsx` + `components/send/*`), baseline 09
- Two bordered input boxes inside a card, uppercase labels, a skeleton where the fee should be, and a faded Continue button.
- **Redesign (Wise/Revolut pattern):** amounts typed **directly on the canvas** in display size, with a currency pill (flag + code + chevron) beside each. Between them, a rate line ("1 RUB = 14.98 NGN · rate held 0:45") and a swap. Below, a collapsible fee breakdown and **"Arrives by Tue"**. Next step: recipient picker sheet (recents first), then review, then pay. The step bar becomes a thin progress line under the header. Keep the same numbers as web.

### Experts directory (`app/experts/index.tsx`), baseline 10
- Featured tiles are solid orange squares with a letter. Service titles are truncated. Every card has its own orange "Book a session" button (8 identical CTAs on screen).
- **Redesign:** a search bar, then category chips with icons. *Featured* as people cards (photo or soft monogram, name, ✓, specialty, ★ rating). Services as **list rows**: title on 2 lines, expert avatar + name, `60 min · from ₽1,500`, and "Next: Tue 10:00" as a green hint. No per-card CTA, the row is the tap target.

### Expert profile (`app/experts/[slug].tsx`), baseline 11
- Languages show as codes ("en, ru, es"). The bio sits in a bordered box. A single service is a half-width card. Reviews is an empty box.
- **Redesign:** centred hero (photo 88, name + ✓, specialty, city/online). A **stat strip** (★ 4.9 · 32 sessions · replies in 1 h). Language chips with flags and full names. A bio with "Read more". Services as rows. A reviews summary (with an empty state that reads well). A sticky **"Book · from ₽2,400"** bar.

### Book a session (`app/experts/book/*`), baseline 13
- **Every slot is struck through but styled like a normal button,** so the screen looks broken. There is a large empty band above the step bar.
- **Redesign:** a date strip that greys out and dot-marks days with no availability, auto-selects the **first available** day, and hides past or taken slots (or dims them clearly). The time zone line is a single short line. A sticky "Continue · Tue 20, 10:00".

### Activities (`app/(app)/activities.tsx`), baseline 14
- **Bug:** rows are titled "Ciuna · 1", which says nothing. The "Total spent $5,779.93" card is in USD while every row is in RUB.
- Every status is the same orange "Pending" pill.
- **Redesign:** large title + search. A pinned **"Needs action"** group (awaiting payment, with a countdown). Rows: line icon or vendor logo, **title = vendor, recipient or expert**, subtitle = "Food · 2 items" or "To Ada O. · NGN", amount right-aligned and **status as small coloured text** under it. Drop the stat cards, or move them to a "Spending" view later. Filter chips stay but use ink selection.

### Order detail (`app/orders/[id].tsx`, 926 lines), baseline 15
- The title is "Order". "Ciuna · 1" and "CTID58644776" are prominent. The copy contradicts itself: the badge says awaiting payment, the meta says "Payment deadline passed".
- **Redesign:** a status hero with a big state + one sentence + **one action** (Pay now / Track / Chat / Rate). A vendor row with chat. Items, then a summary. The timeline is collapsed into a horizontal progress with "Show details". The reference ID goes in a muted copy-on-tap row at the bottom with receipt and help. Split the 926-line file into sections as part of this.

### Account (`app/(app)/more.tsx`), baseline 16
- Titled "More" under the Account tab. The Language dropdown sits inside a row, and the "Profile" pill duplicates the row tap.
- **Redesign:** an identity header (avatar, name, email, **Verified / Verify now** badge), a KYC nudge card if not verified, then inset grouped lists: *Money* (Recipients, Limits), *Rewards* (Referrals), *Security* (PIN, Face ID), *App* (Language ›, Notifications, Favourites), *Help* (Support, Legal), and Sign out.

### Verification, Support, Search, and the rest, baselines 17–25
- **Verification:** two paths at once (a "Verify identity" CTA *and* the upload rows). Show one guided path with progress ("Step 1 of 2 · Identity").
- **Support:** fine structurally, but web-like. Lead with "Message us" (chat), then the FAQ with search, with contact options last.
- **Search:** blank state. Add recent searches, popular categories and trending stores. Results get segmented tabs (All · Products · Stores · Experts).
- **Referrals, Limits, Favourites, Notifications, Recipients, Profile:** apply the inset list, sheet and empty-state system. No bespoke layouts needed.
- **Auth + PIN:** not in the baseline set. Capture them first, then follow DESIGN.md §5 Auth with native Apple/Google buttons and a full-screen keypad.

### Quick wins (bugs, fix before the redesign)
1. Home tile row gap.
2. Cart line total clipping.
3. Activities row titles "Ciuna · 1" → vendor, recipient or expert name.
4. Activities total in USD while rows are RUB.
5. The Account tab screen titled "More".
6. Slot grid shows all slots struck through but enabled-looking.
7. Tab bar under the Cart/Checkout CTA.
8. Order status vs "Payment deadline passed" contradiction.

---

## 4. Design direction

**Principles**
1. **Native first.** Native stack headers, large titles, swipe-back, form sheets, system haptics, SF Symbols (`expo-symbols`) on iOS and Lucide fallback on Android.
2. **One primary action per screen,** always reachable in a sticky bottom bar.
3. **Content over containers.** Inset lists and whitespace, with cards only for tappable objects.
4. **Money is the hero.** Display numerals with tabular figures, the currency always visible, and the same fee numbers as web.
5. **Every state is designed:** loading (skeleton matching the layout), empty (illustration + one action), error (retry), offline.
6. **Personal by default.** Home and Activities surface what needs the user now.

**Visual system changes** (in `design-system/tokens.json`, flowing to `packages/shared/src/design` and `mobile/lib/theme.ts`)
- Type: largeTitle 32/700, title 24/700, section 20/700, listTitle 16/600, body 15/400, secondary 13/400, caption 12/600, display 44/700 tabular.
- Colour roles: `accent` (orange, primary CTA only), `selected` (ink), `onSelected` (white), and semantic status text colours. Paper stays the canvas, white for grouped lists and sheets.
- Spacing: 16 gutter, 8pt grid, 24 between sections, 12 inside rows.
- Radius: 12 controls, 16 cards, 20 sheets, 10 thumbnails, 999 pills.
- Elevation: flat (no edge on grouped lists), raised (object cards, soft shadow and no border), floating (cart bar, sticky bars).
- Motion: press 0.97 / 120 ms, sheet native, add-to-cart badge bump, success check (Reanimated).

---

## 5. Plan

Each phase ships as its own PR. Each one updates the matching `design-system/components/*/README.md` spec first, then the code, then captures **after** screenshots into `docs/mobile-redesign/after/` with the same file names as `baseline/`. A phase is done when:
- iOS and Android screenshots are captured, in light mode.
- Russian and French strings fit (they are the longest), checked with the language switcher.
- Loading, empty and error states are shown in `app/dev/gallery.tsx`.
- `npx tsc --noEmit` and `npm run lint` pass in `mobile/`, and the flow works end to end against the staging API in Expo Go.

### Phase 0: Foundations (finish the in-flight kit)
The work already in the tree (`components/ui/*`, `lib/haptics.ts`, `components/home/*`, `app/dev/gallery.tsx`, token updates) is the start of this. Finish and commit it.
- Type scale and colour roles in tokens (above). Regenerate `tokens.generated.*`.
- **Navigation chrome:** a shared native-stack header config (large title, collapse, transparent-over-media variant). Retire `app-stack-header.tsx` and `stack-back-button.tsx`. Tab bar hidden outside root screens.
- **Sheets:** Expo Router `formSheet` routes with detents for pickers, plus the `ui/sheet.tsx` API for in-screen sheets.
- **Media:** an `ui/media.tsx` wrapper on `expo-image` (blurhash, fade, category-glyph fallback, monogram avatar).
- **Lists:** `ListGroup` / `ListRow` inset style, swipe actions (add `react-native-gesture-handler` swipeable), `FlashList`, and pull to refresh.
- **Feedback:** `PressableScale` on every tappable, haptics map, `Toast`, `StickyActionBar` with a disabled reason, skeleton variants.
- Fix the 8 quick wins above.
- *Exit:* the gallery shows every primitive in every state, and no screen still imports the old header.

### Phase 1: Shell and Home
- Tab bar: SF Symbols icons, ink inactive and orange active, a badge on Activities when something needs action.
- Home: keep the design-system layout (header, hero slider, icon tiles with heading and subtext). Polish only: slider copy and artwork, tile artwork from Office, skeleton.
- Search entry → the redesigned Search screen (recents, categories, segmented results).

### Phase 2: Food and Mart commerce
- **Browse structure (started Oct 17, 2026):** fixed categories set in Office and the seller portal (`hub_products.main_category`, ids in `@ciuna/shared` `HUB_PRODUCT_MAIN_CATEGORIES`). Food shows its six meal types as a grid under search, then stores (Mains, Soups and stews, Grill, Snacks and pastries, Breakfast, Drinks). Mart opens on a "Shop by aisle" grid (Pantry staples, Sauces and spices, Snacks and sweets, Drinks, Fresh and frozen, Digital services; Other only when used). Each opens `/hub/[line]/c/[category]` across all stores with a store filter. The store's own `category` stays as its menu section. Products without a main category are placed by keyword (`mobile/lib/hub-category.ts`).
- Catalog: sticky search, delivery/pickup + address, icon categories, store cards with meta, product cards with price and quick add.
- Storefront: parallax cover, meta row, sticky scroll-spy category tabs, menu rows, floating cart bar.
- Product sheet (food) and product page (mart), sticky add bar.
- Cart sheet, swipe to delete.
- One-page checkout with sheets (delivery, contact, pay with), sticky pay bar, YooKassa native sheet, success screen.
- *This is the biggest phase. Split it into 2a (catalog, store, product) and 2b (cart, checkout, pay).*

### Phase 3: Send
- Amount screen on canvas, currency sheets, rate lock timer, fee breakdown, arrival estimate.
- Recipient picker sheet (recents, search, add new), review screen, pay step, success + receipt.
- KYC gate as a sheet with one clear path into Verification.

### Phase 4: Experts
- **Structure (started Oct 17, 2026):** Experts home opens on "What do you need?", eight main needs for people living in Russia (Documents and visas, Translation, Education, Work and business, Housing, Health, Hair and beauty, Errands), each with its own colour and glyph. A need opens `/experts/c/[category]` with "Who can help" (experts) and "What you can book" (services). Defined in `mobile/lib/expert-category.ts`. Office sets each expert's main category (`expert_profiles.main_category`); experts without one are placed by keyword matching on their specialty and headline.
- Directory: search, icon categories, featured people, service rows with next availability.
- Profile: hero, stat strip, languages, services, reviews, sticky Book.
- Booking: availability-aware date strip, slots, details, review → shared checkout.

### Phase 5: Activities and orders
- Activities: Needs action group, real titles, line icons and logos, status text, FlashList, pull to refresh.
- Order detail: status hero + single action, progress, items, summary, help. Split `orders/[id].tsx`.
- Order chat polish, receipts, transfer detail (same pattern as order detail).

### Phase 6: Account and the long tail
- Account: identity header, KYC card, inset groups, language sheet.
- Verification guided flow, Profile, Security/PIN, Recipients, Referrals, Limits, Notifications, Favourites, Support (chat first), Legal.

### Phase 7: Auth and onboarding
- Capture baseline first. Sign-in and register per DESIGN.md §5, native Apple/Google buttons, OTP and PIN keypad, first-run permissions (push) with clear value copy.

### Phase 8: Quality pass
- Accessibility: Dynamic Type up to XL without clipping, VoiceOver labels on icon buttons, 44pt targets, contrast.
- Android: edge-to-edge, predictive back, ripple vs scale, Material bottom sheet behaviour.
- Performance: image sizes from the API, list virtualization, no layout jank on first paint.
- Dark mode: tokens already split by role, so this becomes a token pass (optional, decide later).

**Suggested order and sizing:** 0 → 1 → 2a → 2b → 5 → 3 → 4 → 6 → 7 → 8. Commerce and Activities come before Send and Experts because they are the most-used surfaces and have the most visible bugs. Phases 3, 4 and 6 touch separate files and can run in parallel once Phase 0 is merged.

---

## 6. Decisions (agreed Oct 17, 2026)

1. **Imagery is required.** Office blocks publishing a store without a cover and a product without at least one photo. This is an office/API change outside the mobile pass, so it gets its own PR. Mobile still ships the fallbacks for existing data.
2. **Home keeps the design-system layout:** header (logo, Refer, avatar), the hero slider, then the 2-column grid of service tiles (icon artwork, heading, one line of subtext) from Office. No Now card or Send again rail on Home. *(Changed Oct 17, 2026 at the user's request.)* Rows no longer stretch to fill the screen, which removed the gap between tile rows.
3. **Store menus:** a list of menu rows for Food, a 2-col image grid for Mart.
4. **Checkout is one page.** Tappable rows open sheets, and a sticky Pay bar shows the total. Details → Review steps are gone.
5. **Activities stat cards are removed for now.** A spending view can return later with per-currency totals.
6. **Dark mode comes later.** Tokens are built by role now, and dark mode is a token pass in Phase 8 or after.
