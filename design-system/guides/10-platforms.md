# Platforms

One product, three surfaces, shared tokens.

| | Customer app | Seller | Office |
| --- | --- | --- | --- |
| Code | `mobile/` (Expo: iOS, Android, web) and `web/` | `seller/` (Next.js) | `office/` (Next.js) |
| Users | Buyers, senders, people booking experts | Store owners, experts, their staff | Ciuna ops, support, finance, compliance |
| Devices | Phone first; tablets and desktop adapt | Phone and desktop equally (PWA) | Desktop |
| Density | Spacious, one primary action | Comfortable; boards and forms | Dense tables, bulk actions |
| Providers named | Never | Never | Yes |
| Language | en ru fr es zh pt | en ru fr es zh pt | en |

## Breakpoints (web surfaces)

`sm` 640, `md` 768 (Seller sidebar appears), `lg` 1024, `xl` 1280. Content max width: Seller 1200, forms 640. Never horizontally scroll the page; tables become stacked cards under `md` in Seller and scroll inside their container in Office.

## Behaviours per platform

- iOS/Android keep their back gesture, system pickers and press feedback.
- Web uses real links (right-click, open in new tab) and keyboard focus rings.
- Seller is installable (manifest + service worker for the shell only). Order alerts arrive by web push, email and Telegram; never rely on the portal being open.

## Navigation

- Customer: Home, Transactions, More (tab bar). Services open from Home tiles.
- Seller (store): Home, Orders, Catalog, Messages, Earnings; More holds Store profile, Team, Settings.
- Seller (expert): Home, Bookings, Services, Messages, Earnings; More holds Profile, Availability, Team, Settings.
- Office: grouped sidebar (Operations, Marketplace, Merchants, Finance, Compliance, Settings).
