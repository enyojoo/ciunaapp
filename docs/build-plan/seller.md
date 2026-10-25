# Seller build plan: bring built Ciuna Seller in line with the design cards

Read-only analysis of `seller/**`, `packages/ui-web`, `api/app/api/merchant/**`, `api/lib/merchant/**`, `supabase/migrations/20261016*`, against `design-system/components/Seller*`, the seller-facing Marketplace cards, `guides/30-seller.md`, `guides/80-decisions.md`.
Sizes: S = under a day of focused work, M = a few days incl. tests, L = a week or more or crosses API, DB and another surface. No calendar estimates beyond that.
Verified in code before writing: where a card's Upgrade line disagrees with the code, the code wins and the difference is noted.

## 0. Findings that change the picture

1. Seller is far closer to the cards than Office: all 23 Seller screens exist. Most gaps are desktop layout, one phone-nav bug and a handful of small "New" states.
2. Phone nav is wrong today: `components/shell/nav.ts` marks Earnings `primary` for store sellers, and `app-shell.tsx` takes `slice(0, 4)` + More, so stores get Home, Orders, Messages, Catalog, Earnings, More = 6 slots (experts get Home, Bookings, Messages, Services, Availability, More = 6). Earnings and Reviews are not reachable from the phone More page (`app/(shell)/more/page.tsx` has no row for them). This is a real dead end, not a polish item.
3. The day separator in `messages/[orderId]/page.tsx` (line ~104) and quick replies (`components/messages/format.ts`) and Seen already exist; the SellerMessages and ChatBubble Upgrade lines understate what is built. Only the desktop split view is missing.
4. Only `orders`, `messages`, `earnings`, `payouts`, `reviews` pages render the Lock empty state (each with its own copy keys). `catalog`, `catalog/fulfillment`, `services`, `availability`, `profile`, `setup`, `bookings` have no guard; `team` shows a bare FORBIDDEN title. The API enforces permissions, so this is UX, not security.
5. `docs/design-to-build-plan.md`, named in `guides/80-decisions.md` as the gate for "New" features, does not exist. Treat this file plus the decisions in section 5 as that gate.
6. There are no Playwright or other browser tests in the repo (the plan doc promised them). Seller has unit tests only for `csv`, `earnings/logic`, `expert/logic`.

## 1. Gap table (card, built?, what differs, size, API/DB)

| Card | Built? | What differs | Size | API / DB |
| --- | --- | --- | --- | --- |
| SellerShellStates | Yes, buggy | 5-item phone nav (now 6); More must reach Earnings, Reviews; More as sheet or page; styled switcher list with role; 64px desktop top bar (search, notifications, account) not built; one NoAccess screen for every section | M | None: `permissions` already returned by `/api/merchant/me`. Top bar search and notifications need a decision (section 5) |
| SellerHome | Partial (two count tiles, setup checklist) | "Needs you" list; Today's earnings card; checklist progress bar and Done/To do badges; real skeleton instead of "–"; hide orders tile without `orders` permission; expert variant follows Bookings | M | New `GET /api/merchant/home` aggregate (new orders or bookings, low stock, documents expiring from `merchant_documents.expires_at`, reviews needing reply via `/reviews` `needs_reply`, payout method waiting, today's `merchant_earnings`). Low-stock threshold has no source (decision D3) |
| SellerOnboarding | Yes | Check mark and radio on selected choice card; text error under language chips when none chosen; role on its own line in invite banner | S | None |
| SellerAuth | Yes | "Forgot password?"; "send it again" and "Open sign in" on check-your-email; desktop card treatment in `components/auth-shell.tsx` | S to M | Supabase `resetPasswordForEmail` plus a new `seller/app/(auth)/reset/page.tsx` (`updateUser`). Needs the reset redirect URL allow-listed in Supabase for seller.ciuna.com; resend uses `auth.resend` |
| SellerSetup | Yes, 4 steps | Verification split into 3 cards (type, details, documents) so each has Done and maps 1:1 to Home checklist; country chip; by-country table; Not uploaded badge and Upload again after rejection; logo card shows current logo | M | None: `/api/merchant/kyb`, `/application`, `/documents` suffice. Country chip needs `merchant.country` (present) |
| DocumentUpload (component) | Partial | expiry and warning lines, uploading progress, quoted-reason banner, locked approved state | S | `expires_at` exists on `merchant_documents` |
| SellerOrders / OrderCard / DueTimer | Yes | Warning state under 5 minutes (`components/orders/due-chip.tsx` only has running and overdue); 36px size; booking slot lines on card; rejected reason on card; desktop board columns (New, Accepted, Preparing, Ready) instead of a 2-col grid | M | Verify `GET /api/merchant/orders` returns the reject reason and slot (events are only on detail today); if not, add `rejectReason` and `slot` to the list payload (S) |
| SellerOrderDetail | Yes | Two columns from 1024px (code uses `xl` at `orders/[id]/page.tsx:93`); phone bar puts Reject and primary on one row (`order-actions.tsx` stacks); reject sheet names the refund amount; completed-state closing note | S | None: amount from `order.totals` |
| FeeBreakdown / StatementRow / EarningsTile | Yes | Rule name under the fee; when-available note; reversed state; cents breakdown; stacked phone statement rows; display-size hero tile for phones with Available tint; combined no-method banner with Manage methods | M | Rule name: `order_fees.snapshot` holds it, expose in `/api/merchant/earnings/items` (S). `merchant_earnings.status = 'reversed'` exists; surface it (currently excluded in `money.ts` totals only) |
| SellerEarnings | Yes | See above; phone Withdraw button beside title | S (with above) | None extra |
| SellerPayoutMethods / PayoutMethodRow | Yes | Card-number error copy; "Withdraw via Ciuna Send" as a disabled Coming soon row; Default badge and waiting copy | S | `is_default` exists. `kind = 'ciuna_send'` is already in the CHECK; keep the add flow disabled |
| SellerPayouts / PayoutRow | Yes | Two-column desktop grid; paid date and time in MSK with zone label; reference note and cancel placement | S | None |
| WithdrawSheet | Yes | Minimum in the field hint, error wording | S | `minPayout` already returned by `/earnings` |
| SellerCatalog | Yes | Matches today | none | None |
| SellerProductEditor / ListingEditor | Yes | Desktop two columns (content left; stock, fulfilment, visibility right) in `components/catalog/product-form.tsx`; new Visibility card (status was set by Save buttons and list Pause); listing health card is New | M | Visibility reuses the product PATCH status. Health card: do not build (D4) |
| SellerImport | Yes | Phone card layout for preview (built scrolls a 720px table); one-line file hint | S | None |
| SellerFulfilment | Yes | One-row zones on desktop; "What this unlocks" panel; missing-setup banners on this page | S | None |
| SellerServices | Yes | Desktop table; In review label on list | S | `review_status` exists on `expert_services` |
| SellerServiceEditor | Yes | Two-column desktop; standalone Languages (spoken) chips; refused-unpublish dialog instead of toast | M | Languages spoken: no column on `expert_services` or `expert_profiles` (only `translations`). New column plus API field plus customer display (D5) |
| SellerAvailability / AvailabilityEditor / TimeOffPanel | Yes | Two columns on desktop; preview grouped by date as chips; Next 14 days empty state; booked-sessions notice after blocking time off | S to M | `time-off` POST returns `{ blocked }`; add `bookedConflicts` count (S) |
| SellerBookings | Yes | Desktop two-column request list; Complete sheet with optional note; refund amount in decline sheet | M | Complete note: reuse order `fulfill` payload `note`. Refund from totals |
| SellerMessages / ThreadRow / ChatBubble | Yes | Desktop split view (thread list left, thread right) instead of a separate page | M | None; day separator and Seen are built |
| SellerProfile | Store yes, expert partial | Discard button and unsaved note; expert credentials, languages spoken, intro video | S (Discard) / L (expert extras) | Extras: new `expert_profiles` columns, upload bucket rules for video, Office review (OfficeExperts credential review), customer profile display. D5 |
| SellerReviews / ReviewReplyCard | Yes | Desktop side-by-side summary; dedicated error state in reply sheet; edit-window note and locked state | S | `REPLY_EDIT_HOURS = 24` in `api/lib/merchant/reviews.ts`; return `canEditUntil` on the review (S) |
| SellerTeam / TeamMemberRow | Yes | Permissions table; pending-invite expiry and Copy link; named remove confirm; permissions summary line | S to M | `expires_at` already returned by `/team`. Permissions table must come from the server: add `roles: ROLE_PERMISSIONS` to the `/team` response (S). Copy link needs the token: invites response returns it only at creation, so store nothing and regenerate via a re-invite endpoint (S) |
| SellerAlerts / AlertChannelRow | Yes | Waiting state and reassurance line; per-type mute list | S to M | `merchant_notification_prefs.muted_kinds` exists; confirm `/api/merchant/notifications` reads and writes it |
| BusinessSwitcher | Yes | Open styled list with current role; Add a business | S | Add business reuses `/onboarding` |
| OnboardingChecklist | Yes | Blocked, in review, rejected badges; progress bar; one-line summary | S | None |
| FulfilmentChip | Yes | Split booking into Online and In person | S | `fulfillmentMode` for bookings: confirm online or in-person is on the order payload |
| StatTile | No | New Home tiles with delta and loading | S | Delta needs yesterday values from `/home` |
| VerifiedBadge | Customer apps only | Seller sees tier on Setup and Profile; customer cards belong to web and mobile plans | S here | Tier already on merchant |

## 2. Shared work first

### 2.1 `packages/ui-web` extraction status
- Present (`packages/ui-web/src`): `cn`, Button, Input, Textarea, Select, Label, Field, Switch, StatusBadge, Card, CardHeader, CardBody, Skeleton, EmptyState, PageHeader, Banner, Amount, Sheet, ConfirmDialog, Toast, Tabs, LanguageTabs, UiStringsProvider. About 390 lines.
- Consumers: Seller only (59 import sites). `web/` and `office/` do not import it; Office keeps 19 shadcn files in `office/components/ui`.
- Missing versus `guides/60-implementation-plan.md` step 3: Checkbox, Dialog (generic; Sheet and ConfirmDialog cover most), DataTable, Stepper, FileDrop, plus new needs from the cards: SidePanel (right drawer, Office), NoAccess, ProgressBar, SegmentedControl, Chip, DueTimer, StatTile.
- Extract from Seller (generic enough to share): `components/image-upload.tsx` becomes FileDrop; `components/orders/due-chip.tsx` becomes DueTimer (add warning state); Seller `ReviewCard` stars (`reviews/stars.tsx`) become RatingStars; the setup-page document row becomes DocumentUpload; `Step` card in `setup/page.tsx` becomes Stepper or ChecklistStep. Keep seller-only: order card, statement, thread row, availability editor.
- Add `NoAccess` to ui-web first (title, body, optional Back link). Use it from a single `RequirePermission` wrapper in `seller/components/shell/` and delete the six per-page copies.
- Rule: do not migrate `web/` in this plan. Office adopts DataTable, SidePanel, Dialog (see office.md).

### 2.2 The 5-item phone nav (fix first, it is a bug)
- `navFor()` in `nav.ts`: keep `primary` only for the four phone slots. Store: Home, Orders, Messages, Catalog. Expert: Home, Bookings, Messages, Services (decisions say Services and Bookings replace Catalog and Orders; do not put Availability in the bar).
- `app-shell.tsx`: render exactly `bottom.slice(0,4)` + More. Move Earnings to `primary: false` for stores. Add a unit test that `navFor("store")` and `navFor("expert")` yield 4 primary items for every role that has all permissions, and at most 4 for restricted roles (a finance role has only Home, Orders; keep 5 slots stable by adding Earnings for roles lacking Catalog).
- `more/page.tsx`: add Earnings (`can("earnings")`), Reviews (`can("orders")`), Availability for experts and Fulfilment for stores (present), Payouts history. Order rows: Earnings, Reviews, Profile, Verification, Fulfilment or Availability, Payout methods, Alerts, Team, Language, Sign out.
- Decide sheet vs page (D1). A page is built and works; the sheet is a presentation change. Recommend keeping the page on phones and sidebar rows on desktop.
- Desktop sidebar: include Earnings, Reviews in groups; move the store switcher styling per BusinessSwitcher.

### 2.3 Shell fixes
- Desktop 64px top bar (guide 30): search, notifications, account menu. Not drawn on SellerShellStates. Build only an account menu (name, role, language, sign out) and a notification bell that links to Orders or Bookings with the new count; defer global search (D2).
- No-access: one `RequirePermission permission="catalog"` wrapper used in `app/(shell)/layout.tsx` via a route to permission map (`/catalog*` catalog, `/services*` catalog, `/availability` availability, `/profile` profile, `/setup` documents, `/bookings*` orders, `/settings/team` team, `/earnings*` earnings, `/earnings/payouts` and `/methods` payouts, `/messages*` messages, `/reviews` orders). Keep API checks as the real gate.
- Skeleton: replace the "–" tiles on Home by a Skeleton in the same layout on first load only (principle 5).
- Role-aware Home tiles: hide orders tile without `orders`; finance role sees earnings only.

### 2.4 Permission model (Seller)
Exists and is enforced: `api/lib/merchant/permissions.ts` roles owner, manager, staff, finance; `merchantRoute(permission, fn)` in `api/lib/merchant/http.ts`; `/api/merchant/me` returns `permissions`; `seller/lib/session.tsx` exposes `can()`. Gap: the Team permissions table and role help must read the server matrix (add to `/team`), not a hard-coded table.

### 2.5 Email logo and time zone (`api/lib/merchant/notify-messages.ts`)
- Logo: add the logo image in `renderAlert` HTML top-left, 22px high, using `SEO_EMAIL_LOGO_LIGHT_URL` from `api/lib/seo.ts` (already used by `api/lib/email-generator.ts`; it is a PNG in Supabase storage called "Ciuna main.png"). Add `alt="Ciuna"`. Add the support line `support@ciuna.com` and company line on every email, and the reason-and-next-step line on rejected and suspended (cards: EmailLayout, EmailSellerAlerts). Preferably export one `emailFrame()` from a new `api/lib/email-frame.ts` and have `generateBaseEmailTemplate` adopt it later; do not refactor the customer frame in this plan.
- Font: replace `system-ui` with a mail-safe stack (`-apple-system, Segoe UI, Roboto, Arial`), no web font in email.
- Time zone: currently `new Date(slotStart).toISOString()...+" UTC"` (line ~37). Replace with `Intl.DateTimeFormat(lang, { dateStyle:"medium", timeStyle:"short", timeZone, timeZoneName:"short" })` giving "3:00 PM WAT". The payload has no zone: the trigger `trg_order_new_alert` in `supabase/migrations/20261016120000_seller_notifications.sql` sends only `slotStart`. `marketplace_orders.snapshot.timezone` is set at `api/lib/marketplace/service.ts:382` (service zone). New migration: recreate the function adding `'timezone', new.snapshot->>'timezone'` to the payload. Renderer falls back to UTC when absent. Zone choice (service zone vs recipient) is D6.
- Cities with no Intl short name show "GMT+1"; acceptable; test with `Africa/Lagos`, `Europe/Moscow`, `Asia/Shanghai`.
- Update `api/tests/merchant/notify.test.ts` line 19 (asserts "2026-10-20 09:00 UTC") and add: logo present in html, text part has no logo, zone label, ru and zh render.

## 3. Ordered work packages

| # | Package | Depends on | Contents | Exit test |
| --- | --- | --- | --- | --- |
| P0 | Test harness | none | Add Playwright for `seller/` against the `NEXT_PUBLIC_SELLER_MOCK=1` mode (`public/dev-mock.js`, `?as=store|expert`); add 375, 768, 1280 projects | One smoke test per route renders without console errors at three widths |
| P1 | Nav and shell | P0 | 2.2, 2.3 (NoAccess, RequirePermission, skeleton, account menu, switcher list) | Playwright at 375px: bottom nav has 5 items for owner store and owner expert; More reaches Earnings and Reviews; a staff user opening `/earnings` sees NoAccess; unit test on `navFor` |
| P2 | Alerts and email | none (parallel) | 2.5, migration for `timezone` payload | `npm run test:merchant -w api` green incl. updated notify tests; manual send to SES sandbox shows logo and "3:00 PM WAT" |
| P3 | ui-web additions | P1 | NoAccess, FileDrop, DueTimer (warning state), RatingStars, ProgressBar, Chip, Stepper | `npx tsc --noEmit -p packages/ui-web seller`; `design:check` and `design:cards` green |
| P4 | Orders and bookings polish | P3 | OrderCard warning, slot lines, reject reason, desktop board columns; OrderDetail breakpoint, phone action row, refund amount; Bookings split view, Complete sheet, decline refund; FulfilmentChip split | Playwright: accept an order at 375 with one tap; overdue and warning states render in words |
| P5 | Home | P1, API `/home` | Needs you list, Today's earnings, StatTile, progress bar, role-aware tiles | Jest or API test for `/home` per role; Playwright for owner, finance, staff |
| P6 | Setup, onboarding, auth | P3 | 3 verification cards, DocumentUpload states, by-country table, onboarding choice cards, forgot password and reset page | Walk register, reset password, submit application on mock; Supabase redirect configured on staging |
| P7 | Money screens | P3 | EarningsTile hero, FeeBreakdown rule name, reversed state, statement phone rows, payout grid and MSK, methods Default badge, Ciuna Send disabled row, withdraw hints | `earnings/logic.test.ts` extended for reversed and cents; screenshot compare at 375 |
| P8 | Catalog and services desktop | P3 | Product editor two columns, Visibility card, import phone cards, fulfilment row layout and banners, services table, service editor two columns, availability grouped preview and notice | Playwright: save product at 1280 and 375 without losing unsaved changes |
| P9 | Messages and reviews | P3 | Desktop split view, reply error state, edit-window note and lock | Playwright at 1280: select thread without navigation |
| P10 | Team and alerts | P1 | Permissions table from server, expiry, Copy link, named remove, Waiting state, mute list | API test for `/team` payload; Playwright for invite copy |
| P11 | Expert extras | decision D5 | credentials, languages spoken, intro video: migration, API, Seller UI, Office review hook, customer display | Only after Office review exists (office.md OfficeExperts) |

Parallelism: P2 is independent. P4 to P10 can run in parallel after P3 by different people since files do not overlap (only `seller/lib/i18n` strings: add keys to all six locales in `packages/shared/src/locales/*` together).

## Status check, 2026-10-25

Only what was verified against the code and the test runs is marked. The other packages (P1 to P10) were not re-audited line by line and keep the status in the gap table above until someone walks them.

| Package | Status | Evidence |
| --- | --- | --- |
| P0 Test harness | Built | `npm run test:seller`: 195 of 195 at 375, 768 and 1280 in mock mode; `tests/seller/languages.spec.ts` adds every screen in ru, fr, es, pt and zh at 375 and 1280 (250 pass): no overflow, no raw translation keys, no console errors |
| P11 Expert extras, credentials | Built | Credentials and years are edited in Seller; Office reviews them (Office, Experts, Credentials tab; approve, or reject with a reason); Seller shows the status; an edit sends the review back to pending. Needs `supabase/deploy/expert-credentials-review.sql` (file 21). Languages spoken and intro video are not built |
| Seller strings | Complete | `npm run locales:check` now also compares `seller/locales` and `api/locales` across the six languages |

## 4. Risks

- Nav fix changes muscle memory for sellers already using the portal; ship with the More page rows first.
- `/home` aggregate could become a slow query; compute counts with indexes already on `marketplace_orders.merchant_id`; cache 30s like orders poll.
- Email time zone depends on payload change in a trigger function: a migration rollback path is just the previous function body; keep the renderer tolerant of a missing zone.
- Desktop split views (messages, bookings) risk regressions in deep links (`/messages/[orderId]`, Telegram and email alerts link there). Keep the dynamic routes and render the split on `lg` only.
- Strings: every new copy key must exist in en, ru, fr, es, zh, pt; 40% text expansion. Add a check that locale key sets match.
- Expert extras (P11) cross three surfaces and a storage bucket for video; scope creep. Hold.
- Per-page NoAccess removal can hide pages permanently for roles that had a working read-only view (finance on orders). Confirm the route-to-permission map with a role walkthrough.

## 5. Product decisions needed

- D1 More: sheet from the bar or the built full page? Recommendation: page.
- D2 Desktop top bar search: what does it search (orders, products, customers)? Without an answer ship account menu and bell only.
- D3 Low-stock threshold: per product field, global default, or Office setting? No number is chosen in the cards.
- D4 Listing health card and "Needs you" copy for documents expiring: how many days before expiry (a number to be configured in Office, not coded).
- D5 Expert credentials, languages spoken, intro video: product go-ahead, who reviews credentials, video size and format.
- D6 Email booking time: service zone, recipient's zone, or both? Recipients have no stored zone; options are a `users.time_zone` field or the service zone.
- D7 Withdraw via Ciuna Send: stays Coming soon (decisions file); confirm no build now.
- D8 Customer tab name "Account" vs "More": decisions keep "More"; do not change Seller copy.

## 6. Do not build yet (New on cards, invented numbers, or out of the decisions)

- Any figure on cards: KYC limits, referral tiers, commission rates 8%, 6%, 12%, withdraw fee 1%, hold days, Telegram expiry 10 minutes, invite expiry. Read from `marketplace_settings` or config. The cents breakdown example "1% fee" is an example only.
- Support reply-time promises on any Seller screen.
- Ciuna Send payouts (disabled row only), listing health score, global search, and any notification setting beyond the existing `muted_kinds`.
- Customer-side VerifiedBadge, ChatBubble quick replies on customer apps, ReviewSummary write flow: other surfaces.
- Web push (runbook: not built); do not imply it in Alerts copy.
