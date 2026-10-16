# Customer app: built and not built (audit of 2026-10-17)

Replaces the gap tables in `customer-app.md` (stale). Source: card READMEs and the mobile code, read by four audits. Status: B built, P partial, M missing. "Blocked" means it needs an API, schema or backend change first; those are listed at the end and are not built.

## Discovery and commerce
| Card | Status | Notes |
|---|---|---|
| CustomerHome | B | Sticky header, slider, tiles, no search |
| FoodHome, MartHome | P | Pill search built; categories still sit below Stores; no offline banner |
| StoreCard | P | No closed state (blocked: hours) |
| StorePage | P | Skeleton built; no share or paused-store state (blocked: status field) |
| ProductCard | B | Low-stock note built; sale price shows struck through |
| ProductPage | P | Gallery with dots, stock line, heart, skeleton built; no sticky bar, no reviews teaser |
| PriceTag, FilterChips | B | Shared components built |
| SearchField | P | Still inline in search.tsx |
| SearchResults | P | No highlighting, per-group See all |
| Favourites | B | |
| FavouriteHeart | B | 34px with 48px target; sign-in prompt not needed (app is signed-in only) |
| EmptyState | B | |
| Skeleton | B | Product, store, cart, activity and expert browse use skeletons |

## Cart, checkout, orders, reviews
| Card | Status | Notes |
|---|---|---|
| Cart, CartLine | P | Unavailable rows, vendor-lock dialog, skeleton built; minimum-order banner blocked |
| MarketCheckout | P | Zone-not-served banner built; Review is still one screen with Details |
| OrderSummary | P | Pickup line, expert-booking variant |
| OrderTracking | P | Status header, delivery/pickup card, timeline built; seller avatar and rating, reason text left |
| OrderTimeline | P | Built from real states; no per-stage times (blocked) |
| OrderChat, ChatBubble | B | Desktop side panel not built |
| ReviewFlow | B | Web dialog missing |
| ReviewCard, ReviewSummary | P | ReviewCard exported with Read more; RatingStars input still inline in the review sheet |
| VerifiedBadge | B | One component replaces five inline marks (tier and tooltip blocked) |
| FulfilmentChip, FulfilmentPicker | M / P | Chip is seller-only; picker lacks fee and ETA |

## Experts
| Card | Status | Notes |
|---|---|---|
| ExpertsDirectory | P | Search, category chips, count, empty and error states built; language chips blocked |
| ExpertCard | P | Rating or New built; from-price and verified flag blocked |
| ExpertProfile | P | Retry built; no sticky Book bar (several services), credentials blocked |
| ServiceCard | P | No duration chip |
| SlotPicker | B (2026-10-17) | Date strip, 3-column grid, zone line; expert zone blocked |
| ExpertBooking | P | No step bar, notes |

## Account and send
| Card | Status | Notes |
|---|---|---|
| CustomerAuth | P | Inline errors on login and register built; no language chip |
| CustomerPin | P | Inline error and red dots built; attempts and lock rules not decided |
| CustomerProfile | P | Language row, email hint, in-app dialogs built; delete is blocked on backend |
| CustomerRecipients | P | In-app delete dialog naming the recipient built |
| CustomerReferrals | P | Code row built; progress strip left |
| CustomerTransactions | P | Skeleton, retry and saved-data note built; Bookings chip left |
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
