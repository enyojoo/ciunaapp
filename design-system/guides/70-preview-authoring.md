# Authoring preview cards

Every component and screen in the design system is a **card**: `components/<Name>/preview.html` (what you see in the viewer) plus `components/<Name>/README.md` (the spec). The viewer lists them from `cards.json`, which `node design-system/scripts/build-cards.mjs` generates.

## File shape

```html
<!-- @dsCard group="Seller · Screens" height=980 width=900 subtitle="One sentence: what this shows and the states it covers" page -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Name</title>
<link rel="stylesheet" href="../bundle.css"><script src="../icons.js"></script><script src="../kit.js" defer></script></head>
<body><div class="cz-page">…</div></body></html>
```

- The **first line** must be the `@dsCard` comment. `group` is one of: Foundations, Actions, Forms, Feedback, Data display, Navigation, Marketplace, Money, Customer app · Screens, Seller · Screens, Office · Screens, Documents and email. `height` is the iframe height in px (make it fit the content exactly, no inner scrollbars). `width` is optional (px) for narrow cards; omit for full width. Add `page` for multi-frame screen cards.
- Icons: `<i data-i="truck"></i>` (Lucide names in `components/icons.js`; size with `style="--s:20px"`). `kit.js` swaps them for inline SVG. Only names present in icons.js work; `check-previews` flags unknown ones.
- Reuse the shared classes in `components/bundle.css` (buttons, forms, badges, cards, tabs, banners, avatars, stars, tables, `.ph` placeholder photos, `.phone` / `.desk` / `.tablet` frames, customer-app chrome `.a-*`, seller shell `.s-*`, office shell `.o-*`, `.doc`, `.email`). **Do not edit bundle.css, tokens.css, kit.js or icons.js** (shared). If you need extra styles, add a `<style>` block inside your own card using only `var(--token)` colours and the shared radius/shadow variables. Never hardcode hex colours (`#fff` is allowed for text on a fill).
- The page background is `var(--paper)`. Phones are 390 × 844, desktops 1200 wide with the browser bar, tablets 820 × 640. Put frames in `.cz-grid` with `.cz-col` + `.cz-cap` captions. Show real states side by side (default, loading, empty, error, overflow/long text) rather than one pretty frame.

## Design rules (the system in brief — read `design-system/README.md` for the rest)

1. Neutrals carry the surface; orange marks the one thing to do. Buttons are `.btn` = **white label on the primary orange**. Never fill a page or large card with orange. The logo orange (`--brand-primary`) is only for the logo, avatars/illustrations and large decorative shapes, never for text or buttons. Orange text/links use `--primary-text`.
2. Statuses: one word, one colour pair, with an icon or word, never colour alone. Completed/Paid/Live/Verified/Accepted → success; Pending/Preparing/In review/New/Awaiting → warning; Failed/Rejected/Overdue/Suspended → destructive; Draft/Paused/Cancelled/Refunded → neutral. Orange is never a status.
3. Money: symbol first, comma thousands, no `.00` on whole amounts in lists, cents kept in breakdowns, true minus `−`, tabular figures (`.num`). `₽1,250`, `$24.50`, `€9`, `¥380`, `₦12,500`, `R$89`.
4. Voice: plain, calm, specific, sentence case, no emoji, no exclamation marks on money or status. Buttons name the action ("Accept order", "Reject order", not "OK"). Errors say what to fix.
5. Customer and seller screens never name payment providers (no YooKassa/Bitbanker). Office may.
6. Light only. 48px minimum tap targets on phones. Text meets AA.
7. Audience: foreigners living in Russia (African, Chinese, Latin American, Central Asian and other communities) and the small businesses serving them. Use realistic content: Moscow and St Petersburg addresses, RUB prices, businesses like "Mama T's Kitchen", "Lagos Pantry", "Guangzhou Market", "Latina Despensa", "Sahel Spices"; experts like "Dr. Amina Yusuf, immigration lawyer", "Li Wei, Russian tutor", "Carlos Mendes, sworn translator"; customers like Amara Okafor, Chen Hui, Sofia Ramirez, Kwame Mensah. For key screens add a variant in another language (Russian, Chinese, French, Spanish or Portuguese) to show text expansion; keep it real, not lorem ipsum.
8. Customer app screens use `.phone.native` (system font). Seller and Office use the web font (Geist).

## README.md (spec) shape

Sections, in this order, each short and concrete (the checker requires these headings): `# Name`, `## Purpose`, `## Anatomy`, `## States`, `## Rules`, `## Upgrade`, and optionally `## Code` (file path where it is or will be built). For screens, "Upgrade" says what differs from the built app today (or "New" if not built).

## Checks

```
node design-system/scripts/check-previews.mjs YourCard1 YourCard2   # header, README, icons, classes, hex, emoji
node design-system/scripts/build-cards.mjs                          # regenerate cards.json
```

The viewer (already running at http://localhost:4871/viewer.html#CardName) loads cards live. Do not use the shared browser pane yourself; the lead reviews rendering.
