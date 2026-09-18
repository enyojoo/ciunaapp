# Ciuna design

Ciuna is a **super-app for people living abroad** (Africa–Russia corridors in product copy). One account, four jobs, one activity list: **send money home**, **order food**, **buy from mart**, **hire experts**. Trust, KYC, Support, and `en` / `ru` / `fr` / `es` matter more than a marketing hero.

This file is the source of truth for **product, brand, naming, and native UI**. Web (`app.ciuna.com` on a phone) is the product reference. Expo must match that product, not the desktop sidebar.

Native canvas may be warmer paper + system type. Web stays Geist + near-white. That fork is intentional — do not load Geist in Expo.

## Product

Four engines we ship. Office Hub Services still drives which tiles appear.

| Line | Job to be done | Shape |
| --- | --- | --- |
| **Food** | Order food from vendors | Catalog → store → checkout → order |
| **Mart** | Buy products (foodstuffs and more) | Same marketplace chrome as Food, different catalog |
| **Send** | Send money home | **Transfers only** — not a bank (no wallet, cards, or balances) |
| **Experts** | Find people and hire them | Directory → profile → book → pay |

Food and Mart share one marketplace engine. No map or live courier this pass (web does not have it). Experts is booking. Send is the transfer API. Home is the grid. **Transactions** lists send + food/mart/expert orders together.

**One pay model:** Food, Mart, and Experts checkout reuse the send pay step (`sendCurrency`, `receiveCurrency`, contact). Not a shopping-cart UX.

### Grid vs engines (do both)

Office **Settings → Hub Services** (`/settings?tab=hubServices`) is the CMS for the **Home grid only**: on/off, sort, title, description, **icon image**, `grid_kind`, `route_path`, external `href`. Web already works this way. **Expo must too**.

Office does **not** invent checkout, send, or booking. Those are **product engines**:

| `grid_kind` / slug | Engine |
| --- | --- |
| `food`, `mart` (`hub_category`) | Marketplace |
| `send` (`app_link` → `/send`) | Transfer wizard |
| `experts` | Directory → book → pay |
| Other `hub_category` | Thin catalog or coming soon |
| `external_url` | Open the link |

Do not hardcode four tiles. If office disables Mart or swaps the Food icon, Expo must follow.

The **app name is Ciuna**. The first tab is **Home** (web and Expo, same i18n). Code still uses **hub**.

Assistant is built on web but office-off — do not polish it this pass. Insurance / Experiences / Gift Packs stay tiles-only.

---

## 1. Brand

| Token | Value |
| --- | --- |
| Name | **Ciuna** |
| In-app line | Super-app (food, mart, send, experts) — not “send money globally” |
| Primary | `#F97316` |
| Primary hover / press | `#EA580C` |
| Primary deep | `#C2410C` |
| Paper (native canvas) | `#FAFAF8` |
| Web canvas | `oklch(0.99 0 0)` |
| Surface (tiles, sheets) | `#FFFFFF` |
| Text | `#111827` |
| Muted | `#6B7280` |
| Hairline | `#E8E4DC` |
| Success | `#059669` |
| Danger | `#DC2626` |
| Refer / earn | Teal-emerald pill (already on web) |
| Logo | [Ciuna.svg](https://seeqjiebmrnolcyydewj.supabase.co/storage/v1/object/public/brand/Ciuna.svg) |
| Support | `support@ciuna.com` |

Native type: **SF Pro / system**. Titles 22–24, body 15–16, meta 13. Web keeps Geist.

Radius: **16** product cards, **12** list rows, **999** pills. Tap targets **48px**. Sheets ~**180ms**.

Primary CTA = pay / send / checkout. Secondary = outline / ghost. Refer is teal, not orange.

Show the **same fee numbers as web**. Do not invent a “free” story that contradicts the send breakdown.

---

## 2. Naming

| Layer | Call it | User-facing? |
| --- | --- | --- |
| Company / store listing | **Ciuna** | Yes |
| First tab | **Home** | Yes (en/ru/fr/es together) |
| Platform, URLs, APIs, office | **hub** | No |
| A tile | **Service line** title from office + i18n | Yes |
| Activity list | **Transactions** | Yes (money spine) |
| Account | **More** | Yes |

Do not rename `/hub` or `hub_*` APIs. Keep “Hub” in office where it means non-send orders (`type: hub`).

**Rejected:** Dashboard, Super, Grid, Services as a tab, Ciuna as a tab, Expo-only Home with Hub still on web.

---

## 3. Information architecture

```
Home  →  office grid  →  Food / Mart / Send / Experts
Transactions  →  combined list  →  order detail
More  →  identity, KYC, referrals, PIN, recipients, support, legal
```

Home owns every service line. Auth and PIN sit outside the tab bar.

---

## 4. Native visual rules

Home: **logo left, Refer pill + Support right, then 2-col office-icon tiles**. No orange billboard. No “Good evening, FirstName.” Optional one muted line from `hub.heroBody`.

2-col with captions is correct for 4–8 office artworks. Do not copy a WeChat 4-col mini-grid.

| Avoid | Do |
| --- | --- |
| Full-bleed white | Paper canvas; white on tiles/sheets |
| Giant orange hero | Compact header |
| Emoji tab icons | Lucide: Home, History, More |
| Hardcoded tiles | `GET /api/hub/service-lines` |
| Cart-only checkout | Reuse send pay step |
| Raw `TextInput` | Shared `Field` |
| PIN on More | Full-screen keypad |
| Web hover shadows | 4:3 image, title, price, one CTA |
| Leading with `TXN-` | Amount + who/what + status chip |

**States:** skeleton Home tiles, empty catalog, failed pay, keyboard + safe area.

Sheets for currency, recipient, filters — not desktop dialogs.

---

## 5. Screen intent

| Surface | Intent |
| --- | --- |
| Home | Logo, Refer, Support, 2-col tiles (`icon_url`, i18n) |
| Food / Mart catalog | Image, title, vendor chip, price, stores strip |
| Storefront | Vendor catalog |
| Checkout | Send-like pay + `POST /api/hub/checkout` |
| Experts | Directory → profile → book → same pay model |
| Send | Amount → FX / who receives / arrival → recipient → pay. Same numbers as web |
| Transactions | Amount, counterparty, status, line |
| More | Identity first, then Account / App groups, KYC badge |
| Auth | Centered title, Apple + Google outline then Or then fields, forgot under password, orange CTA, one-line footer, help to support. Splash and Home carry the logo — do not repeat it on sign-in |

---

## 6. MVP slices

Expo Go after each slice. APIs already live — do not rebuild.

1. Shell + Home from Hub Services
2. Food + Mart marketplace
3. Send wizard
4. Experts hire
5. Transactions + order
6. More, PIN keypad, auth polish

Then EAS. Out of scope: Assistant polish, Insurance/Experiences/Gifts as products, wallet/cards, `m.ciuna.com`, office UI.

---

## 7. Copy & i18n

Reuse `@ciuna/shared` locales. Tile titles from `hub.serviceLineTiles.*`.

`nav.home` and `nav.hub` display **Home** (Accueil / Главная / Inicio) in all four locales.

---

If brand orange or the logo URL changes, change `web/theme/brand.ts`, NativeWind `primary`, and this file in the same PR.
