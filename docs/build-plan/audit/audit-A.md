# Audit A: CustomerHome, HomeSlider, FoodHome, MartHome, SearchResults, Favourites

Paths relative to /Users/a1/Projects/ciunaapp. Code read, shots viewed (home, home-320x568, home-1280x800, food-home, food-home-1280x800, favourites, favourites-1280x800). The app was not run.
No search shot exists.

## Cross-cutting (all cards)
- MISMATCH desktop shell: web desktop uses a left sidebar (Home / Activities / More) from mobile/components/layout/desktop-nav.tsx. Cards and decision 14 want a top nav (Home, Orders, Favourites, Refer, Support, avatar). Affects every desktop frame.
- MISMATCH offline: one global pill "You are offline. Showing saved data." (mobile/components/offline-banner.tsx, mounted at app/_layout.tsx:130). Cards show an in-page neutral banner with the cache age ("Showing stores from 2 hours ago"). The cached data does stay on screen, so the behaviour is right. Low priority; the cache timestamp is in lib/cache.ts.
- MISMATCH no screen using `useCachedQuery` surfaces its `error`. See Home, Food and Mart below.

## CustomerHome (mobile/app/(app)/hub/index.tsx, components/tile.tsx, app-header.tsx) - Mostly
Deliberate deviations (not gaps):
- Desktop greeting and referral plate are not built (decision 10).
- No search on Home; Support removed from the header; the avatar opens the profile.
- Home tiles use drawn icons, never Office `icon_url` (the `iconUrl` prop on Tile is unused by Home).
- Sticky header, no orange billboard.

Findings:
- OK: sticky header (logo, Refer, avatar); slider; 2-col tiles that flex to the screen height; two description lines reserved; 4 across on wide web; first-load skeleton; cached tiles shown offline; pull to refresh.
- MISMATCH error state: `useHubServiceLines` has an `error`, but index.tsx:77 ignores it. A failed first load with no cache shows the EmptyState "Unavailable" with no retry. README: "Unavailable with retry".
  - Fix: if `error && !data`, render `LoadError onRetry={revalidate}`. Keep "Unavailable" for an empty list, and add actionLabel "Try again" (`EmptyState` supports it).
- MISMATCH skeleton: 4 tiles (index.tsx:54-66); the card shows 6. Trivial.
- MISMATCH muted line: the card's Improved frame has a muted line "Everything you need in Russia, in one place." under the header. It is absent from the app and from the running-app shot. The Upgrade text does not mention it, so confirm with the owner whether it is dropped. Not recorded in decisions.
- MISMATCH banner minimum height: `bannerHeight` clamps 104-176 (home-slider.tsx:38) and the README says 128-176. At 320x568 it is about 108. Intentional compacting per the Upgrade text, so low.
- MISMATCH small screen: the 320x568 shot shows tile artwork squashed to about 55px. It fits without scroll, as the Upgrade text promises.
- Chinese / Russian wrap: tile title and description wrap (2 lines). OK.
- Desktop web: tiles in one row of 4, height capped at 320, banner fits the column. OK apart from the shell.

## HomeSlider (mobile/components/home-slider.tsx, lib/home-slides.ts) - Mostly
Deliberate: three "what Ciuna is for" banners and the gradient deepened from the old hero (decisions 2026-10-16); height follows the screen.

- OK: auto-advance 5s; pause on touch and resume after 8s; swipe; dots; hidden when empty; no dots or timer for one slide; Ad label supported; localised in 6 languages (`home.slide.*`).
- MISMATCH title truncation: the title is `numberOfLines={1}` (home-slider.tsx:~118) at 19px. The card says 22px, wraps to two lines, never truncates. The 320x568 shot shows "Home is wherever y…" and the body "Money, groceries, people fro…". Fix: allow 2 lines for the title and the body. Drop the kicker or shrink the font when height is below 128. Check ru and fr.
- MISMATCH first slide link: slide "belong" has href "/hub" (lib/home-slides.ts:16), which is Home itself, so "Explore" does nothing visible. Point it at refer (`/referrals`) or another next step. The card says slides must not repeat the tiles.
- MISMATCH radius is 20 (card: 18). Icon well is 48px, radius 16. Trivial.
- Paused while touched: relies on `onTouchStart`; on desktop web, mouse hover or drag does not pause. Minor.
- NEEDS-BACKEND slides from Office (title, line, link, `ad` flag, order): static `HOME_SLIDES` today. Needs an Office-managed slides table and an endpoint (for example `/api/hub/home-slides`), then a fallback to the static list. The tone and icon mapping would need a field.
- Loading placeholder: not needed while static. Needed once the data is remote (one gradient placeholder).

## FoodHome (mobile/app/(app)/hub/[slug]/index.tsx, hub-line-page-shell.tsx, hub-cart-bar.tsx, store-item.tsx, catalog-products.tsx) - Partial
Deliberate / out of scope:
- StoreCard and ProductCard stay as built (decisions). So the store card does not show a delivery-time and minimum line, a cuisine, or the card's 104px cover layout. This is not a gap.
- Delivery fee and minimum per area were cut for v1.
- Hub top bar (white, hairline, 40px back chip, title and subtitle, cart icon on the right) follows decision 2026-10-17.
- The search field is a tap-through to the scoped Search screen (reconciliation).

Findings:
- OK: header, search field (SearchEntryField, index.tsx:~74), chips, Stores rail with See all, product grid (4-up on desktop), first-load skeletons for rail and grid, closed-store shading, hearts.
- MISMATCH cart bar colour and shape: the card has a 56px, radius 16 bar in `--primary` orange with a white label. The app has a dark pill (`#111827`, radius pill) in hub-cart-bar.tsx:50-60. The Mart README says "primary orange". No decision records the dark one. Fix: `backgroundColor: colors.primary`, radius 16, height 56. Also the total only shows when a product has `fixed_currency`.
- MISMATCH chips: the app builds chips from product `category` ("All categories", Drinks, Meals, Snacks; `catalogCategories`) and they filter products only. The card shows "All" plus cuisines (Nigerian, Chinese, Latin, Halal) that filter the stores rail too. NEEDS-BACKEND: a vendor cuisine or tag field (not in `HubVendor`, lib/types.ts:77) and the Office list of chips. Cheap fix now: rename "All categories" to "All".
- MISMATCH section title "Products" (catalog-products.tsx heading) vs the card's "Featured". Copy only.
- MISSING error with retry: `useHubCatalog` returns `error`, but the screen ignores it. A failed first load shows "No stores yet - check back soon" and "No products available yet." Fix: `if (error && !data)` render `LoadError` with `revalidate`.
- MISSING empty-line action: the empty line is plain text (`storesEmpty`) with no "Back to Home" button, and `CatalogProducts` shows an EmptyState without an action.
- MISMATCH offline: see cross-cutting.
- MISMATCH desktop web: the card has a 4-column Stores grid and a cart pill in the header. The app has a horizontal rail of 200px cards (index.tsx:~97), the floating bar, a back chip and a title row. `StoreGridCard` is a fixed 48.5% (store-item.tsx `gridHit`), so the Stores directory (`stores.tsx`) and Search are 2 across on desktop. Fix: use `catalogCardWidth(useCatalogGridColumns())`, and on wide web render the stores as a grid and hide `HubCartBar` in favour of the header cart pill with count and total.
- Long text: names and titles use single-line ellipsis, which is the owner decision for product cards. OK.

## MartHome (same shell: hub/[slug]/index.tsx; mobile/app/mart.tsx redirects to /(app)/hub/mart) - Partial
The README claims Mart is "Food layout applied". Search, chips, rail, grid with stepper, closed store, sold out and offline are all built via the shared shell, so the Food findings apply, plus:
- MISSING error with retry (card state 8): see Food. Same code path.
- MISSING "No stores deliver to this address yet" with "Change address" (state 7). There is no delivery-area or address filtering anywhere in mobile/. NEEDS-BACKEND: vendor delivery zones (decision 1) with `/api/hub/vendors` filtered by the buyer's address, plus an address chooser.
- MISMATCH closed store: the rail card shows a dimmed cover with a "Closed" chip (store-item.tsx:~66). The card shows the opening time ("Opens 9:00 AM MSK"). `storeOpenLine()` (lib/store-hours.ts) already produces "Closed · opens Mon 9:00" and is used by StoreRow only. The store-card exception may cover this, so confirm. A cheap fix is to use `storeOpenLine` in StoreFace.
- MISMATCH inline results line ("6 results for "rice" · Halal") and the inline "No results - Clear search": not built. Search is a separate scoped screen (reconciliation). A category with no products shows "No products in this category" with an All action, which is close. Treat as deliberate.
- MISMATCH out-of-stock: the card hides Add and shows an "Out of stock" badge. The app shows a disabled "Sold out" button (product-card.tsx:179-185). OK in spirit.
- Chips African/Chinese/Latin/Halal/Spices: NEEDS-BACKEND (Office-set chip list or product tags). The app shows whatever product categories exist.
- Russian: wraps via shared components. OK.
- Prices without .00: not checked in `formatMoney`.

## SearchResults (mobile/app/search.tsx, lib/recent-searches.ts, components/highlight.tsx, search-entry.tsx) - Mostly
Deliberate (reconciliation): result cards instead of 56px rows; no suggestion rows while typing; no "Popular near you" (cut for v1, no data source); scoped by entry (`?line=`); "Try instead" chips = Search everywhere plus recents; hero search chip on phones. Note: reconciliation says no match highlighting, but `HighlightProvider` and `Highlighted` are now built (search.tsx:78, store-item.tsx), so that note is stale.
- OK: min 2 chars with a hint; 350ms debounce; recents (device-local, Clear); grouped Products, Stores, Experts with See all (N); chips only when 2 or more groups; no-results text; error with retry (`LoadError`); 429 notice; skeletons; auth redirect.
- MISMATCH chips appear only for non-empty groups and when more than one group (search.tsx:~182). The card shows All, Products, Stores, Experts together. Fine.
- MISMATCH loading skeleton is a card grid, not rows. Deliberate by consequence.
- MISMATCH offline: a failed request shows LoadError "Couldn't load" and there is no offline banner scoped to Search. Recents still show when the query is empty. Acceptable. Optional: use `useOffline()` and show the neutral line.
- MISMATCH desktop web: no max-width column. The body is full width and `StoreGridCard` is 48.5% wide, so there are 2 stores across and 4 products across (uneven). Wrap in `NARROW_COLUMN` or use the shared catalog columns.
- Missing scope control: when opened from Food/Mart there is no visible chip to widen the scope except from the no-results state. Minor.
- Experts in Food/Mart scoped search: experts are not searched in scope food/mart. Fine.
- Closed or sold-out items appear with status: ProductCard and StoreFace handle it. OK.
- The README says "To be built `mobile/app/(app)/search.tsx`"; the actual file is `mobile/app/search.tsx`. README is stale.

## Favourites (mobile/app/favourites.tsx, lib/favourites.ts, components/favourite-heart.tsx, list-rows.tsx) - Mostly
Deliberate: Favourites lives under More (decision 11), not in tabs. The reconciliation doc says the app uses 2-col image cards for stores and experts, but the code now uses rows, matching the card, so that note is stale.
- OK: tabs; store and expert rows; product grid; heart toggle (filled = saved, state in `accessibilityState`); optimistic toggle with Undo toast (5s); empty copy per tab with a CTA; skeleton; error with retry; closed stores dimmed (`rowClosed`); hearts hidden when the table is missing.
- MISMATCH signed out: shows only "Sign in" and the title "Sign in to see your favourites". The card shows "Sign in" and "Create account" with the title "Sign in to save favourites". The route is behind auth, so this is rarely reached. Low priority.
- MISMATCH empty state: a separate 56px heart well plus `EmptyState` with `paddingVertical: 64` leaves a large gap (see favourites.png). Fix: pass `icon={<Heart/>}` into `EmptyState` (the prop exists, empty-state.tsx) and drop the wrapper (favourites.tsx:~100).
- BUG loading skeleton on the Products tab: it renders 2 `StoreGridSkeleton` plus 2 `ProductCardSkeleton` (favourites.tsx:~82-92). It should be product skeletons only.
- MISSING offline read-only list: README admits it. The favourites store is in-memory only (lib/favourites.ts `state`), so a cold start offline shows `LoadError`. Fix: persist the last `FavouritesData` through `writeCache` and show it with a failed flag. Client only.
- MISMATCH unavailable items stay listed with their status: stores yes (closed or paused line in StoreRow), products via ProductCard "Sold out", experts no status. Minor.
- MISMATCH when `unavailable` (table not applied) the screen shows the empty copy "Tap the heart..." while no hearts exist. Show a neutral unavailable state instead.
- Wide web: the NARROW_COLUMN (720) column is used, so the card layout holds. The product grid is limited by `ProductCard` width logic. OK.
- Store row has no delivery-time or minimum line (the card shows "35-50 min · ₽150"). The store-card exception and the "cut for v1" note cover it. NEEDS-BACKEND if wanted (delivery time per area).
