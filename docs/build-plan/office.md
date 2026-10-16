# Office build plan: bring built Office in line with the design cards

Read-only analysis of `office/app/**`, `office/components/**`, `office/lib/**`, `api/app/api/admin/**`, `api/lib/admin-roles.ts`, `api/lib/admin-auth-utils.ts`, `api/lib/merchant/{http,audit}.ts`, `supabase/migrations/20261016*`, against the 22 `Office · Screens` cards and `guides/40-office.md`. Office routes live in `api/app/api/admin/**` (there is no `api/app/api/office`).
Sizes: S = under a day, M = a few days incl. tests, L = a week or more or new backend domain.
Where a card's Upgrade line disagrees with code, the code wins and it is called out.

## 0. Findings that change the picture

1. The role matrix exists but protects little. `api/lib/admin-roles.ts` defines ops, support, finance, compliance, super_admin and 11 permissions. Only 17 of about 57 admin routes use `adminRoute(permission, ...)` (merchants, kyb-profiles, fee-rules, fee-plans, marketplace-settings, payouts, payout-methods/verify, audit, reviews). About 40 legacy routes check only "is in `admin_users`" (`getAuthenticatedUser` plus a select, or `requireAdmin`): users and their status and verification, `kyc`, `transactions` and `transactions/[id]/status`, `hub/*`, `expert/*`, `marketplace/orders/[id]/actions` (cancel, refund, paid, failed), `marketplace/catalog`, `assistant`, `referral-payouts`, `settings`, `currencies`, `exchange-rates`, `receipts`, `auth-users`. So a `support` user can today cancel and refund orders, change transaction status, verify KYC, and edit settings. This is the top risk.
2. The OfficeShell card says "role hiding for support is already in the built layout". It is not. `office/components/layout/office-dashboard-layout.tsx` only hides Settings for non-super-admins (`isSuperAdmin`). There is no `support` string anywhere in `office/`.
3. The client has no permission model. `office/lib/auth-context.tsx` reads `user_metadata.role` (which can drift from `admin_users.role`, the server's source); pages use three ad-hoc helpers in `office/components/merchants/merchant-lib.ts` (`canDecide`, `canManage`, `canEditKyb`) that duplicate the API matrix. No `GET /api/admin/me` exists.
4. Roles cannot be assigned. `api/app/api/admin/admin-users/route.ts` has `ASSIGNABLE_ROLES = ["admin"]`; there is no role-change endpoint (only status). The CHECK or enum on `admin_users.role` is in the baseline schema, which is not under `supabase/migrations` (the 17 migrations start at September 2026; `docs/marketplace/schema-baseline.json` has no `admin_users`). Confirm the column accepts the four new roles before building the Roles screen.
5. Audit is append-only and enforced in SQL (trigger `audit_log_immutable`) and used by merchant, finance, fee, KYB, decision and review routes. The legacy routes above write nothing, so "every state change shows who and when" is false for users, KYC, transactions, referrals, hub, settings and marketplace order actions.
6. There is no listing-change review in Office. Seller shows `review_status` pending and rejected banners on products and services (`seller/components/catalog/product-form.tsx`), but the only code that touches `review_status` in `api/app/api/admin` is `merchants/[id]/decision` (approves all at first-listing review). OfficeCatalog's "review queue" and templated rejection reasons need a real route: `admin/hub/products/[id]`, `admin/expert/services/*`.
7. Claim and ownership: `merchant_applications.assigned_to`, `marketplace_orders.assigned_to` and `owner_team` exist and are unused by Office UI except an `owner_team` text input in `merchants/[id]/page.tsx`. No queue has a per-item claim API, no SLA fields.
8. Naming trap: Office route `/orders` is the inbound assistant plus expert bookings queue (`office/app/orders/page.tsx`); real marketplace orders live in `/marketplace` (tabs orders and catalog). The OfficeOrders and OfficeMarketplace cards map the opposite way. Resolve in the route map (section 2.3).
9. `office/app/settings/page.tsx` is 2,641 lines with seven tabs (platform, payment, security, referrals, hubServices, rates, admin). `fees` and `fees/settings` are already separate routes.
10. There is no Cmd-K, no saved views (no table), no export, no sidebar counts API, no SLA configuration, no KYC level or limit-usage model, no screening or case tables, no referral block flag, no maintenance end or message. Several cards draw numbers as examples (decisions file): none may be hard-coded.

## 1. Gap table

| Card | Built? | What differs | Size | API / DB |
| --- | --- | --- | --- | --- |
| OfficeShell | Partial | Five fixed groups (today collapsible Operations, Merchants, Finance, Hub with ad-hoc links); count badges on queues; role chip in header; role-hidden groups; Cmd-K palette with grouped results (new); Read-only badge for support | L | `GET /api/admin/me` (role, permissions) new; `GET /api/admin/queues` counts new; `GET /api/admin/search` (merchants by name, orders by public id, users by email) new. Palette lib: `cmdk` not in `office/package.json` |
| OfficeDashboard | Partial | Needs action table with age, SLA, owner, items mine; role variants; all-clear state; four tiles currently transfers, volume, users, pending (uses `useOfficeData`) | M | New `GET /api/admin/queues` (merchants in review, payouts open, KYC pending, exceptions, listings, disputes); SLA targets from config (D3) |
| OfficeMerchantsQueue | Yes (tabs, search, type filter, columns) | Owner column, SLA column, claim and next action, saved views, country base to operating pair, live age replaces Submitted | M | Claim: `PATCH /api/admin/merchants/[id]` with `assigned_to` (column exists on `merchant_applications`); saved views table new |
| OfficeMerchantReview | Yes (sections, decision dialog, `lg:sticky` right column, owner_team) | Sticky decision panel exists; missing inline "Approve disabled because" reason; answers validated against KYB requirements; owner team shown (the Upgrade line says no sticky panel and no owner team: code has both) | S | `GET` already returns kyb profile; add `missing[]` in API response or compute client side |
| OfficeKyb | Yes | Role notice banner for read-only; paused state with a word; saved audit line in dialog footer | S | None |
| OfficeMerchantMoney | Built | none | none | None |
| OfficePayouts | Yes (over 48h text exists in `finance/payouts/page.tsx` ~line 122) | Verified or Unverified badge in the row (only in panel); saved views; export | S to M | `payout_methods.verified` already joined? add to list payload; saved views shared table; CSV export client side |
| OfficeFees | Yes (routes `/fees`, `/fees/settings`; `FeeCalculator` present) | Accepted-orders note as a visible banner on every tab; calculator beside plans layout | S | None |
| OfficeAudit | Yes | Merchant name and actor picker instead of raw IDs; saved views; export; expandable details JSON | M | `GET /api/admin/audit` returns ids only: join merchants and admin_users names, add actor search (S); views table |
| OfficeAnalytics | Yes | Table alternative for daily GMV bars, period text with time zone | S | None (`api/app/api/admin/analytics/marketplace`) |
| OfficeReviewsModeration | Built | none (check hide with reason path) | none | None |
| OfficeCatalog | No review queue | One catalog (Food, Mart together) with review queue, rejection templates, claim and owner, edit dialog; today separate `food/products`, `mart/products`, `products/[id]/edit`, `components/hub/*` | L | New listing review API: list `review_status = pending`, approve, reject with reason, writes audit; add `claimed_by` (decision D4). Seller already displays `review_note` |
| OfficeExperts | Yes (separate pages) | Approval status and queue, credential review with reasons, one detail with services | M now, L with credentials | Credentials and languages spoken have no table (see seller.md D5); until then show approval status via merchant status only |
| OfficeBookings | Yes (table, per-row status Select) | Dual-zone times, meeting link, dispute view with decision, status as read-only badge changed by actions | L | New booking action endpoint (confirm, cancel, refund, resolve dispute); dispute data model does not exist. Slot has time zone on `expert_service_slots`/service |
| OfficeOrders | Different screen | Full marketplace order list with exceptions, timeline, role-based cancel and refund dialog. Real data is in `/marketplace`; `/orders` is a different queue | M | `marketplace/orders/[id]/actions` already does cancel, refund; add permission `orders.manage` (exists) and audit; exception flag from `exception_reason`, `overdue_at` |
| OfficeMarketplace | Mis-mapped | Card: home tile configuration (order, on and off, per-language copy, publish). Built `/marketplace` is orders plus catalog; tile config is partly `settings` hubServices tab and `hub/service-lines` | M | `hub/service-lines` exists; per-language copy column may be new |
| OfficeTransactions | Yes (1,474 lines) | Replace bulk status edits with role-based Retry and Refund; timeline, age, corridor; settlement into panel | L | `transactions/[id]/status` is permissionless and bulk; new retry and refund endpoints; provider names stay (Office only) |
| OfficeUsers | Yes (1,162 lines, dialog per row) | Side panel, KYC level and limit usage, required block reasons, unblock history, saved views | L | No KYC level or limit model found in repo; limits are placeholder numbers (decisions). Block reason and history: new `user_status_events` or audit rows. Needs permission `users.manage` |
| OfficeKyc | Yes (cards plus dialog, free-text reason) | Queue with age, SLA, claim; document vs profile comparison; templated reasons and the verbatim message preview; document-open logging | L | `kyc/documents` route; claim and SLA fields new; templates table new; open-logging via audit |
| OfficeCompliance | Different | Built is customer verification list; card is a case workflow (screening alerts, hits, transfer holds, resolve) | L, defer | No tables for screening, cases or holds; needs a screening provider. Move the existing document review to KYC (above) |
| OfficeReferrals | Yes (466 lines, dialog) | Programme settings on same route; At limit, Blocked states; side panel; block with reason | M | Settings today in `settings` referrals tab; block flag and reason new column; referral-payouts routes legacy |
| OfficeRates | Yes (panel under settings) | Own route; corridor table with markup, source, stale detection, validation limits, reason and history | L | `exchange-rates` legacy route; corridor and history model needs checking; shared with customer app money rules |
| OfficeSettings | Yes (one page) | Split by route (General, Hub services, Payment methods, Rates, Fees, Roles); maintenance with end time and message; language list; role matrix; role change confirmation | L | Maintenance end and message columns new; role change endpoint new (finding 4); at least one super_admin guard exists for deactivation only |

## 2. Shared work first

### 2.1 Role matrix and permission model (do before any screen)
- Source of truth: `api/lib/admin-roles.ts`. Move it to `packages/shared/src/admin/roles.ts` (and re-export from the api path) so Office imports the same matrix. Delete `canDecide`, `canManage`, `canEditKyb` in `merchant-lib.ts`.
- `GET /api/admin/me` returns `{ id, email, name, role, permissions }` from `admin_users`. `auth-context.tsx` uses it instead of `user_metadata.role`; `useRouteProtection` gets `requirePermission`.
- Extend `AdminPermission`. Current 11 keys do not cover: `users.manage` (block, unblock), `kyc.review`, `transactions.manage` (retry, refund), `referrals.manage`, `settings.manage` (general, maintenance), `catalog.manage` (hub products and vendors, listing review use `listings.review`), `experts.manage`, `compliance.resolve`, `rates.manage`, `analytics.read`. The mapping per role is a product decision (D1); the cards give hints (support read only; compliance resolves cases; finance has payouts, fees, money; only super_admin sees Roles and Maintenance).
- Convert every legacy route to `adminRoute(permission, ...)` with audit writes. Add a test that fails when a file under `api/app/api/admin/**/route.ts` neither uses `adminRoute` nor is on an explicit allowlist (one-time scan test in `api/tests/`).
- Back-compat: legacy role `admin` maps to ops (`normalizeAdminRole`); `ops` must not silently lose access to routes it uses (users, kyc, transactions). Add those permissions to ops, finance, compliance explicitly in the matrix.
- Roles screen needs: role change endpoint, `ASSIGNABLE_ROLES` to the five roles, last super_admin guard on role change as well as deactivation, DB constraint check (finding 4). Roles take effect on next token; show "will be signed out" per the card.
- Client rule: hide, never disable, via a `<Can permission="...">` component and a `usePermission()` hook in `office/lib`.

### 2.2 Audit coverage
Add `audit()` calls (from `api/lib/merchant/audit.ts`) to all converted routes: users status and verification, kyc decisions, transactions retry and refund, referral payouts, settings and maintenance, admin-users, hub product and vendor changes, order actions, listing review. Include `actor_role`, entity, reason. Add document-open logging for KYC and payout detail reveals.

### 2.3 Shell and routes
- Target groups (OfficeShell card): Operations, Marketplace, Merchants, Finance, Settings. Proposed route map: Operations = Dashboard, Users, KYC, Compliance, Transactions, Assistant; Marketplace = Orders (move to `/marketplace/orders`, keep `/orders` redirect), Catalog, Bookings, Reviews, Home tiles; Merchants = Applications, KYB, Experts, Audit; Finance = Payouts, Fees, Money settings, Analytics; Settings = General, Hub services, Payment methods, Rates, Roles. Sidebar group disappears when role has nothing in it.
- Header: role chip (always visible), user menu, Cmd-K trigger. Counts from `/api/admin/queues`, polled every 60s and refreshed on focus.
- Command palette: add `cmdk` (new dependency, approve in D6), groups merchants, pages, orders; data from `/api/admin/search`.
- Extract `office/components/layout/office-dashboard-layout.tsx` into data-driven nav (array of groups with permission and badge key) so role hiding is one filter.

### 2.4 `packages/ui-web` for Office
Status: Office imports nothing from `@ciuna/ui-web` (own shadcn copies in `office/components/ui`, 19 files). `ui-web` lacks what Office needs: DataTable (sticky header, column chooser, saved views, bulk bar, right-aligned tabular money, row click opens panel), SidePanel (right drawer), Dialog with reason field and templates (`office/components/merchants/decision-dialog.tsx` is the prototype), Checkbox, Stepper, StatusBadge (exists, shares vocabulary with Office `FinanceStatusBadge`, `MerchantStatusBadge`, `ReviewStatusBadge`: unify), RoleChip, AgeSla chip (age plus "Over by 27h" in words), SavedViews, Toolbar, EmptyState (exists).
Plan: build DataTable, SidePanel, ReasonDialog, AgeSla in `packages/ui-web` (shared with Seller). Office adopts per screen; keep Office-only shadcn files until their screen migrates; add `@ciuna/ui-web` to `office/package.json` and Tailwind `content` (check `office/app/globals.css` token blocks already come from `design:sync`). Light only: remove Office `.dark` rules last.

### 2.5 Saved views and export
One table `admin_saved_views(id, admin_id, route, name, filters jsonb, shared boolean)` and one hook `useSavedViews(route)`; CSV export client side from the current filter, streamed via API for over 5,000 rows. Used by Merchants, Payouts, Audit, Users, KYC.

### 2.6 Claim, owner, SLA
A single pattern: `claimed_by uuid`, `claimed_at` on each queue table (merchant_applications has `assigned_to`; add to KYC submissions, payouts, listing review, exceptions) and `POST .../claim`, `DELETE .../claim` (audited). SLA targets live in `marketplace_settings` keyed by queue (`sla_hours.merchant_review`, etc.), read by `/api/admin/queues`. Do not seed invented hours without D3.

## 3. Ordered work packages

| # | Package | Depends on | Contents | Exit test |
| --- | --- | --- | --- | --- |
| O0 | Permission model | none | 2.1 matrix move, `/admin/me`, new permission keys, convert legacy routes, scan test, client `<Can>` and `usePermission` | API test: for each role, each route returns 403 for a forbidden permission and 200 for allowed (matrix-driven table test); scan test passes; support cannot POST order actions |
| O1 | Audit coverage | O0 | 2.2, names in audit list | Every converted mutating route writes one audit row (test asserts per route) |
| O2 | Shell and nav | O0 | 2.3 groups, role chip, hide groups, counts, `/admin/queues`, redirect old routes | Playwright per role (ops, support, finance, compliance, super_admin): visible links match matrix; counts equal table counts |
| O3 | ui-web Office primitives | O2 | DataTable, SidePanel, ReasonDialog, AgeSla, StatusBadge unification, saved views hook | Component specs match `design:cards`; tsc across office and seller |
| O4 | Roles and Settings split | O0, O3 | Role change endpoint, Roles route with matrix and confirmation, split `settings/page.tsx` into routes, maintenance end and message, `settings.manage` | Last-super_admin guard test; maintenance toggle shows confirmation naming affected users; settings routes reachable per role |
| O5 | Merchant queue and review | O3 | Owner, SLA, claim, saved views, type filter, country pair, inline Approve-disabled reason, KYB role notice | Claim by two admins conflict test; Approve disabled states explained |
| O6 | Finance polish | O3 | Payouts verified badge in row, views, export; Fees banner; Audit pickers and views; Analytics table alt | CSV export matches row count; axe check on analytics table |
| O7 | Listing review and Catalog | O0, O1, O3 | Listing review API and UI, templates, claim, unified catalog, edit dialog | Seller pending banner clears after approval and shows `review_note` after rejection (cross-surface test with seller mock) |
| O8 | Orders, Marketplace, Bookings | O3 | Move marketplace orders to `/marketplace/orders` with exception queue, timeline, refund dialog; Bookings dual-zone and actions; home tile config | Refund by support blocked; refund by finance audited; booking times show both zones |
| O9 | Dashboard and Cmd-K | O2, O5 to O8 | Needs action table, role variants, palette | Palette returns merchants and orders; dashboard queue counts equal sidebar badges |
| O10 | Users, KYC, Referrals, Transactions | O3, D2 | Side panels, block reasons, templates, claim, retry and refund, programme settings route | Block requires reason and writes audit; KYC rejection message shown verbatim before send |
| O11 | Rates | O4 | Own route, corridor table, history | Depends on money model review |
| O12 | Compliance cases | D5 | Case domain and screening | Do not start until provider, retention and legal sign-off are agreed |

O5, O6, O7, O8 can run in parallel after O3 (distinct files). O10 should wait for the legacy route conversion in O0.

## 4. Risks

- O0 can break working admin flows (ops using users, kyc, transactions today). Ship matrix additions before conversion, and run each role through a smoke script on staging.
- Role source drift: client metadata vs `admin_users.role`. Fixed only by `/admin/me`; until then roles in the UI can disagree with the API.
- `admin_users.role` DB constraint unknown (baseline not in repo): a role change may fail in production only.
- Moving `/orders` and merging catalog changes bookmarks and any links in emails or docs; keep redirects.
- Settings split (2,641 lines) risks regressions on payment methods and platform config that the customer app reads; split mechanically first, then redesign.
- Compliance and KYC need legal retention rules for documents and hit data; Office must show provider names only here, never leak to Seller.
- Saved views and claim add write traffic; claim races need a conditional update (`where claimed_by is null`).
- Refund and retry endpoints touch money; reuse the ledger rules and idempotency keys from `api/lib/marketplace`.

## 5. Product decisions needed

- D1 Role-by-role permission table (what support, ops, finance, compliance may do on each screen). The OfficeShell card shows variants but not a full matrix.
- D2 KYC levels and monthly limits: source of truth and values (cards draw placeholders).
- D3 SLA targets per queue and who sees "Over by" breaches; with no numbers, build the display but keep targets empty.
- D4 Listing review scope: which fields force re-review after live (Seller doc says title, image, description; confirm), and the rejection template list.
- D5 Compliance: screening provider, hold rules, who resolves.
- D6 Add `cmdk` and `@ciuna/ui-web` dependencies to Office.
- D7 Whether support may see provider names and payout reveals (logged reveal on the payout card).
- D8 Booking disputes: policy and refund rules before the dispute view is built.
- D9 Referral block: effect on pending rewards (card says already paid stay).

## 6. Do not build yet

- Any number drawn on a card: KYC limits per level, referral tiers 0.5, 0.75, 1 percent and minimum, commissions 8, 6, 12 percent, withdraw fee 1 percent, hold days, SLA hours, support hours, Telegram or invite expiry. Read from `marketplace_settings` or Office settings; ship empty or default-off states.
- OfficeCompliance case workflow and sanctions screening (O12) until D5.
- Booking disputes (D8) and corridor history in Rates beyond the existing list (until money model reviewed).
- Sample names (Ada K., Grace T.) and "Block appeals" on cards are sample data, not features.
- Any change that exposes provider names outside Office; keep Seller and customer error copy provider-free.
