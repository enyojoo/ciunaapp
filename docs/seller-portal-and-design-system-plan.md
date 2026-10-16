# Ciuna Seller, the Ciuna design system, and the Office upgrade

16 October 2026. Supersedes the "merchant self-service is out of scope" line in [marketplace-checkout-plan.md](./marketplace-checkout-plan.md). Brand and customer rules stay in [DESIGN.md](../DESIGN.md) until the design system replaces it.

This is sequenced by dependency, not by calendar. Each phase has an exit test; the next phase starts when the test passes.

---

## 1. Thesis

Ciuna serves **foreigners living in Russia**: African, Chinese, Latin American, Central Asian, South Asian and other communities. Their needs are specific: food from home, services in their own language (translation, migration and visa help, legal, tutoring, health), and money moving to and from home.

Super apps win on **supply-side tooling**, not on the customer grid:
- Meituan and Grab win because a restaurant can run its whole day from one merchant tool.
- WeChat and Alipay win because one identity and one money rail connect every service.
- Gojek and Swiggy win with take-rate tiers, paid placement and fast settlement.

So Ciuna's moat is **Ciuna Seller**. Customer features follow supply.

The unfair advantage is that Ciuna already owns a cross-border money rail (Send). A merchant's earnings can be withdrawn through the same rail, to a card in Russia or to a wallet or bank in Lagos, Guangzhou or São Paulo. No marketplace in Russia offers that to its sellers.

## 2. Decisions

| Question | Decision | Why |
| --- | --- | --- |
| Seller surface | **Web portal only**: `seller/` Next app at `seller.ciuna.com`. Fully responsive, installable as a PWA. No in-app seller mode. | One codebase, no store review, and it works on any phone. Sellers run orders from phones, so mobile web is a first-class target. |
| Seller alerts | Web push, email, and a **Telegram bot** for new orders and bookings. WhatsApp later. | Telegram is the default business channel in Russia and the communities served. A missed order is a lost seller. |
| Revenue model | A configurable **fee engine** controlled in Office. Launch with commission on, everything else available but off. | See section 6. |
| Merchant geography | Merchants are **country-aware, not Russia-only**. Sell in Russia (RUB) by default; remote experts can serve from anywhere. | See section 7. |
| Orange | **Keep `#F97316` as the brand fill. Filled buttons carry dark ink (`#111827`, 6.3:1), never white.** Orange *text* and links use `#C2410C` (5.2:1). Hover and press use `#EA580C` (ink on it is 5.0:1). | White on `#F97316` is 2.8:1 and fails AA. Switching fills to `#C2410C` makes the brand brown and dull. Dark text on bright orange is the Meituan, Swiggy and Uber Eats pattern: it stays vivid, readable and recognisable. |
| Languages | Seller portal and listings in `en`, `ru`, `fr`, `es`, plus `zh` and `pt` added to shared locales. | Matches the communities. Listings carry per-language title and description. |
| Customer-facing brand | Ciuna only. No provider names (YooKassa, Bitbanker) outside Office. | Same rule as easnerbanking. |

## 3. Track A: the Ciuna design system

Create `design-system/` at the repo root, mirroring easnerbanking.

**Structure**
- `README.md`: principles, voice, money and status rules.
- `tokens.json`: the single source of truth.
- `guides/`: `10-platforms`, `20-customer-app`, `30-seller`, `40-office`, `50-documents-and-email`, `60-implementation-plan`.
- `components/<Name>/README.md` + `preview.html`: one spec per component, with an "Upgrade" note marking what changes from today's code.
- `viewer.html`, `scripts/check-cards.mjs`, `changelog.json`.

**Principles to write down**
1. Neutrals carry the surface. Orange signals intent (actions, active states, links).
2. Warm paper canvas, white plates. Geist on web, system type on native (the existing intentional fork, now tokenised).
3. One status vocabulary, one colour pair each: Completed, Live and Paid are green; Pending, In review and Preparing are amber; Failed, Rejected and Overdue are red; Draft, Paused and Cancelled are neutral. Orange is never a status.
4. Money through one `Amount` / `formatMoney` only. Port the easnerbanking rules: symbol first, tabular figures, no `.00` on whole amounts, `₽` for RUB, cents kept in breakdowns.
5. Instant by default: cached data first, skeletons only on a true first load.
6. Accessible without exceptions. Every text pair meets AA and focus rings meet 3:1. No white text on orange.
7. Voice: plain, calm, says what happens to money and when. Sentence case. No emoji or exclamation marks on money states.

**Token pipeline** (replaces the three hardcoded copies)
```text
design-system/tokens.json
   -> packages/shared/src/design/tokens.ts      (typed)
   -> scripts/sync-brand-css.ts                 (web, seller, office globals.css)
   -> mobile tailwind.config.js + src theme     (Expo)
   -> test: tokens.json == tokens.ts == every globals.css == mobile theme
```
`web/theme/brand.ts`, `mobile/tailwind.config.js` and the `DESIGN.md` colour table become generated or references.

**Shared web UI package.** Extract the shadcn primitives into `packages/ui-web` so `web`, `seller` and `office` use one Button, Input, Table and StatusBadge. Office currently has its own copy.

**Component backlog (specs first, then code)**
- Foundations: Button (white label on primary), Input, Select, Sheet, Dialog, Tabs, Toast, Skeleton, StatusBadge, Amount, DataTable, EmptyState, FileDrop, ImageUploader, LanguageTabs, Stepper, Timeline.
- Customer: ProductCard, StoreCard, ExpertCard, RatingStars, ReviewList, OrderTimeline, BookingCard.
- Seller: AppShell (sidebar on desktop, bottom nav on phone), OrderCard and OrderBoard, ListingEditor, VariantGrid, AvailabilityEditor, EarningsTile, PayoutRow, OnboardingChecklist.
- Office: AppShell, ApplicationReviewCard, FeeRuleEditor, LedgerTable, ExceptionQueue.

**Exit test:** `check-cards` passes, the drift test is green, and the Seller shell and one customer screen render from tokens with no hardcoded hex.

## 4. Track B: merchant foundation (data and identity)

**Schema (new migrations, which also bring the baseline schema under version control)**

| Table | Purpose |
| --- | --- |
| `merchants` | The business: type (`store` or `expert`), legal name, display name, country, operating country, languages, status, verification tier, default currency, fee plan |
| `merchant_members` | user_id, merchant_id, role (`owner`, `manager`, `staff`, `finance`) |
| `merchant_applications` | Submitted onboarding data, documents, reviewer, decision, reason |
| `merchant_documents` | KYB files per country, with status and expiry |
| `merchant_payout_methods` | Destination type and details (encrypted), currency, verified flag |
| `*_translations` (jsonb on listing rows) | Per-language title and description |

- Add `merchant_id` to `hub_vendors`, `hub_products`, `expert_profiles` and `expert_services`.
- Backfill: every existing vendor and expert gets a placeholder merchant that Office owns, so nothing breaks.
- RLS by `merchant_members` membership. A member sees only that merchant's rows.
- Lifecycle: `draft -> in_review -> live <-> paused`, plus `rejected` with a reason. The edit-after-live rule: price and stock changes apply instantly; title, image and description changes re-enter a lightweight review.
- API: new `/api/merchant/*` namespace in `api/`, with a membership check in one middleware. Admin routes stay as they are.

**Onboarding (in Seller)**
1. Sign in with the existing Ciuna account (same identity as the customer app; this is the WeChat-style single identity).
2. Choose Store or Expert, then country and languages.
3. Business details, then country-specific KYB driven by a config table (see section 7).
4. Profile: logo, cover, bio, hours or service area.
5. First listing: a guided first product or first service.
6. Payout method.
7. Submit. Office reviews. The status page shows what's missing.

**Exit test:** a new user can apply, Office can approve, and the merchant sees only its own data under RLS (covered by an automated RLS test).

## 5. Track C: Ciuna Seller (the portal)

New Next app, `seller/`, sharing `packages/ui-web`, `@ciuna/shared` and the design tokens. Mobile-first layout: bottom navigation on phones, sidebar from tablet up.

**Navigation:** Home, Orders (or Bookings), Catalog (or Services), Messages, Earnings, Store profile, Settings.

**Home:** today's tiles (new orders, awaiting action, today's earnings, rating), an onboarding checklist until live, and a to-do list of what needs action.

**Store sellers**
- **Catalog:** categories, multiple images, variants and options, stock, sale price, scheduling, CSV and Excel bulk import and export, per-language content, duplicate, pause. Order of work: single product, then variants and images, then bulk import.
- **Fulfilment:** pickup or delivery, delivery zones and fees (reuse `marketplace_zones`), prep time, opening hours, holiday mode, minimum order.
- **Orders board:** New -> Accepted -> Preparing -> Ready or Shipped -> Completed. Accept or reject (with reason) inside the SLA, with timers. Auto-expire if untouched, which returns stock. Print slip. Substitution and out-of-stock handling per line.

**Expert sellers**
- **Profile:** credentials and verifications, languages spoken, intro video, specialties, service area or online.
- **Services:** fixed, hourly or package, durations, online or in-person, per-language copy.
- **Availability:** weekly hours, timezone, buffer, notice period, time off. Slots are **generated from these rules** (replaces manual admin slots; keep manual override).
- **Bookings:** accept or decline requests, reschedule, cancel with policy, meeting link, mark complete, deliverables and notes.

**Both**
- **Messages:** order- or booking-scoped chat, with machine-translation assist (ru, en, fr, es, zh, pt), since buyer and seller often do not share a first language. This is a real differentiator for this audience.
- **Earnings:** balance (pending, available), per-order breakdown showing gross, fee, net, an exportable statement, and payout history.
- **Payouts:** request withdrawal to a saved payout method, including **"Withdraw via Ciuna Send"** to a recipient in the seller's home country.
- **Reviews:** read and reply.
- **Team:** invite staff with roles.
- **Settings:** notification channels (push, email, Telegram), language, business details, documents and expiry reminders.
- **Insights (later in this track):** sales over time, top items, conversion, repeat customers.

**Exit test:** a seller can onboard, list, receive a paid order, fulfil it, and see net earnings, on a phone and a desktop, using only Seller.

## 6. Revenue: the fee engine

One engine, configured in Office, evaluated at checkout and written to the ledger.

**Fee types**
- **Commission:** percent of item subtotal.
- **Fixed fee per order or booking.**
- **Listing fee or subscription plans** (for example Free / Pro tiers with different commission and perks).
- **Promoted placement** (feature a store or listing for a period or on a CPC basis; off at launch).
- **Payout fee** (flat or percent, waived above a threshold).

**Resolution order (most specific wins):** merchant override -> category -> service line -> platform default. Each rule has a currency, optional min and max, and effective dates, and fees are **snapshotted onto the order** so later rule changes never rewrite history.

**Launch defaults:** commission per service line, set by Office (Food, Mart, Experts differ). Subscription, listing fee and promotion are built but switched off. Early merchants can be given a launch rate via override.

## 7. Multi-country merchants

- Every merchant has `country` (where the business is based) and `operating_country` (where it sells or delivers). Launch operating country: Russia. The model must not assume Russia.
- **Listing currency and customer pay currency:** RUB for Russian-resident customers (YooKassa and bank methods already exist). Experts serving remotely can price in USD, EUR or RUB; checkout converts through the existing rates and shows the pay currency prominently.
- **KYB profiles are config, not code:** a `kyb_profiles` table keyed by country lists the required documents and fields (for example Russia: INN or self-employed status; China: business licence; Nigeria: CAC registration; Brazil: CNPJ; individuals: ID plus proof of address). Adding a country is a data change in Office.
- **Tiers:** Tier 1 (individual or self-employed: lower limits and simple listings), Tier 2 (registered business: full limits). Tier gates payout limits and who can sell regulated categories.
- **Payout rails by country**, via `merchant_payout_methods`:
  - Russia: bank card, SBP, bank account in RUB.
  - Elsewhere: through Ciuna Send to a recipient (USDT leg or local rails the desk already supports).
  - Payouts start **manual in Office** (queue, approve, mark paid with reference), then automate per rail once volume justifies it.
- **Compliance guardrails:** prohibited-items list per service line, a sanctions and PEP check at the KYB step where required, and a visible reason on every rejection.
- **Language:** seller UI localised in all six languages; the review team sees listings in the seller's original language plus a machine translation.

## 8. Track D: customer-side upgrades

Built after Seller can produce real supply, but specs start in the design system now.
- **Discovery:** search (Postgres full-text and trigram first), categories, filters, sort, favourites, recently viewed, reorder, and collections that Office merchandises ("Nigerian pantry", "Visa help").
- **Trust:** verified badges tied to the KYB tier, ratings and reviews (only after a completed order or booking, with merchant replies), a report and dispute flow, clear refund and cancellation policy on every listing.
- **Tracking:** order and booking timeline with push notifications and in-thread chat, and a join-call button for bookings.
- **Cross-sell loops:** after a Send, suggest relevant stores and experts; at marketplace checkout, offer saved recipients for gifting; referrals reward both sides.

## 9. Track E: Office upgrade

- **Roles and audit:** replace the single `super_admin` with ops, support, finance, compliance and super_admin, with an append-only audit log of every admin action.
- **Merchants:** application queue with a side-by-side review (documents, risk notes, decision and reason), suspend and reinstate, view-as-merchant, fee overrides, tier changes.
- **Moderation:** listing review for changed content, review and report handling, prohibited-item flags.
- **Orders and exceptions:** exceptions queue (SLA breaches, unpaid, stuck, disputed), refund actions, vendor-contact notes.
- **Finance:** merchant ledger, settlement runs, payout queue with approve and mark-paid, reconciliation against YooKassa and Bitbanker, fee-rule editor (section 6), commission reports.
- **Merchandising:** featured stores and listings, collections, Home grid (existing Hub Services).
- **Analytics:** GMV, take rate, active merchants, time-to-first-order, fulfilment rate, cancellation rate, funnels.
- **Maintenance:** split `settings/page.tsx` (2,641 lines) into route-level sections, adopt `packages/ui-web`, add a shared DataTable with saved views, bulk actions and Cmd-K search.
- Office remains the only place that names payment providers.

## 10. Engineering foundations

- **Ledger:** double-entry from the first paid merchant order (accounts: customer payment, merchant pending, merchant available, platform fees, payouts, refunds). Every balance is derived from entries, never stored as a mutable number.
- **Order state machine:** extend `marketplace_orders` with a seller-action layer (accept, reject, ready, ship, complete), idempotent transitions, and events written to `marketplace_events`.
- **Notifications service:** one internal service that fans out to push, email, Telegram and in-app, with per-user preferences and retry. Build it once; Seller and the customer app both use it.
- **Uploads:** signed uploads, image resizing and format conversion, size limits, malware scanning for documents.
- **Search:** start on Postgres; abstract behind one interface so a dedicated engine can replace it later.
- **Security:** merchant RLS tests, encrypted payout details, rate limits on `/api/merchant/*`, and no PII in logs.
- **Quality gates:** carry over the release-gate log discipline from the marketplace work: each phase records environment, scenario, result and evidence. Add Playwright flows for Seller (onboard, list, fulfil, payout) and unit tests for the fee engine and ledger.
- **Housekeeping:** baseline schema migrations; keep `hub` naming internal; update `DESIGN.md` to point at the design system once it exists.

## 11. Order of work

```text
Phase 0  Design system tokens + pipeline + foundation components     (unblocks everything)
Phase 1  Merchant schema, RLS, roles, applications, KYB config;
         Office roles + application review                           (needs Phase 0 tokens)
Phase 2  Seller shell + onboarding + store catalog + orders board;
         notifications service + Telegram                            (needs Phase 1)
Phase 3  Ledger + fee engine + earnings + manual payouts (Office);
         expert availability and bookings in Seller                  (needs Phase 2)
Phase 4  Messages + reviews + discovery + trust (customer side);
         Office exceptions, disputes, merchandising, analytics       (needs Phase 3)
Phase 5  Payout automation per rail, subscriptions, promoted
         placement, Seller insights                                  (needs live volume)
```

Phases overlap where files do not: Office role work and the Seller shell can proceed in parallel once Phase 1 lands.

## 12. Success measures

- Time from application to first live listing.
- Share of applications approved within the Office SLA.
- Seller order acceptance rate and median time to accept.
- Fulfilment rate and cancellation rate by seller.
- GMV, take rate, and repeat-customer rate per service line.
- Percentage of seller activity done on a phone (confirms the responsive-web bet).
- Share of payouts that go through Ciuna Send (confirms the money-rail advantage).

## 13. Risks

- **Supply quality at launch:** mitigate with a verified-badge tier, review before first listing goes live, and a launch commission rate for early sellers.
- **Fraud and prohibited goods:** prohibited-item rules, KYB, and post-sale exceptions queue.
- **Payout and sanctions exposure for cross-border merchants:** start manual, per-country KYB, sanction screening, and compliance sign-off per rail before automating.
- **Language gap between buyers and sellers:** order-scoped chat with translation (section 5).
- **Scope:** Seller is a product, not a CMS. Protect Phase 2's exit test and defer insights, ads and subscriptions until the core loop (list, order, fulfil, get paid) is solid.
