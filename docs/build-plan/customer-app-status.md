# Customer app: built and not built (audit of 2026-10-17)

Replaces the gap tables in `customer-app.md` (stale). Source: card READMEs and the mobile code, read by four audits. Status: B built, P partial, M missing. "Blocked" means it needs an API, schema or backend change first; those are listed at the end and are not built.

## Discovery and commerce
| Card | Status | Notes |
|---|---|---|
| CustomerHome | B | Sticky header, slider, tiles, no search |
| FoodHome, MartHome | P | Search is a header icon, not the pill field; categories sit below Stores; no offline banner |
| StoreCard | P | No closed state (blocked: hours) |
| StorePage | P | No share, jump chips, paused-store state, skeleton |
| ProductCard | B | Low-stock line and sale badge missing |
| ProductPage | P | No sticky bar, stock line, heart, gallery dots, reviews teaser, skeleton |
| PriceTag, FilterChips, SearchField | P | Inline only; no shared components |
| SearchResults | P | No highlighting, per-group See all |
| Favourites | B | |
| FavouriteHeart | P | Size, in-flight state, sign-in prompt |
| EmptyState | B | |
| Skeleton | P | Detail screens use a spinner |

## Cart, checkout, orders, reviews
| Card | Status | Notes |
|---|---|---|
| Cart, CartLine | P | Unavailable items hidden silently; no vendor-lock sheet; spinner not skeleton |
| MarketCheckout | P | Review is not a separate step; zone-not-served banner missing |
| OrderSummary | P | Pickup line, expert-booking variant |
| OrderTracking | P | Status header, delivery/pickup card, payment card, seller avatar, awaiting-payment banner, reason text |
| OrderTimeline | P | Built from real states; no per-stage times (blocked) |
| OrderChat, ChatBubble | B | Desktop side panel not built |
| ReviewFlow | B | Web dialog missing |
| ReviewCard, ReviewSummary, RatingStars | P | Inline, not shared components |
| VerifiedBadge | P | Inline only |
| FulfilmentChip, FulfilmentPicker | M / P | Chip is seller-only; picker lacks fee and ETA |

## Experts
| Card | Status | Notes |
|---|---|---|
| ExpertsDirectory | P | No filters or search on browse |
| ExpertCard | P | No rating, from-price |
| ExpertProfile | P | No sticky Book bar, retry, skeleton |
| ServiceCard | P | No duration chip |
| SlotPicker | B (2026-10-17) | Date strip, 3-column grid, zone line; expert zone blocked |
| ExpertBooking | P | No step bar, notes |

## Account and send
| Card | Status | Notes |
|---|---|---|
| CustomerAuth | P | Errors are toasts, no language chip |
| CustomerPin | P | Errors are toasts, no attempts or locked state |
| CustomerProfile | P | No language row, system alerts |
| CustomerRecipients | P | System alert for delete |
| CustomerReferrals | P | No code line, progress strip |
| CustomerTransactions | P | Spinner, no error or offline state |
| CustomerSend, CustomerTransferDetail | P | Verify flow, repeat transfer, share receipt |
| CustomerMore, Languages | B | |
| CustomerKyc, CustomerLimits, CustomerSupport | P / M / P | Mostly blocked |
| ReceiptCustomer, PushAndInApp | M | Blocked |

## Blocked on API, schema or backend (not built)
- Structured store hours and open/closed; delivery fee, minimum order, ETA (delivery zones schema).
- Store cover image field in the vendor payload.
- Expert spoken languages, credentials, verified flag, time zone; next availability.
- Per-stage order timestamps; seller rating on the order; chat response-time line.
- Verified tier and check date.
- Account deletion; KYC levels and limits; support requests and chat; push registration; PDF receipts.
- Popular near you; translation hint.

## Not to build (decisions)
"Notify me" on experts, expert intro video, "Report a problem" wording (support link stays "Contact support"), seller-only chat chips (customer-visible).
