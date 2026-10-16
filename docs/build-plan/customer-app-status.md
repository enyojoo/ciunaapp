# Customer app: built and not built (audit of 2026-10-17)

Replaces the gap tables in `customer-app.md` (stale). Source: card READMEs and the mobile code, read by four audits. Status: B built, P partial, M missing. "Blocked" means it needs an API, schema or backend change first; those are listed at the end and are not built.

## Discovery and commerce
| Card | Status | Notes |
|---|---|---|
| CustomerHome | B | Sticky header, slider, tiles, no search |
| FoodHome, MartHome | P | Pill search built; categories still sit below Stores; no offline banner |
| StoreCard | B | Closed state, cover image, verified tier built (needs storefront-details.sql) |
| StorePage | P | Open/closed line, cover, minimum order, skeleton built; no share or paused-store state |
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
| Cart, CartLine | P | Unavailable rows, vendor-lock dialog, skeleton, minimum-order note built |
| MarketCheckout | P | Zone-not-served and minimum-order banners, area delivery time built; Review is still one screen with Details |
| OrderSummary | P | Pickup line, expert-booking variant |
| OrderTracking | P | Status header, delivery/pickup card, timeline built; seller avatar and rating, reason text left |
| OrderTimeline | P | Built from real states; no per-stage times (blocked) |
| OrderChat, ChatBubble | B | Desktop side panel not built |
| ReviewFlow | B | Web dialog missing |
| ReviewCard, ReviewSummary | P | ReviewCard exported with Read more; RatingStars input still inline in the review sheet |
| VerifiedBadge | B | One component, two tiers (tooltip with check date still blocked) |
| FulfilmentChip, FulfilmentPicker | M / P | Chip is seller-only; picker lacks fee and ETA |

## Experts
| Card | Status | Notes |
|---|---|---|
| ExpertsDirectory | P | Search, category and language chips, count, empty and error states built |
| ExpertCard | P | Rating or New and verified mark built; from-price left |
| ExpertProfile | P | Retry, languages, credentials, years, verified tier built; no sticky Book bar (several services) |
| ServiceCard | P | No duration chip |
| SlotPicker | B | Date strip, 3-column grid, two-zone line (needs storefront-details.sql for the expert zone) |
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

## Built in the storefront-details work (needs supabase/deploy/storefront-details.sql run)
Opening hours with time zone, open/closed state, minimum order (enforced at order time), delivery time per area, store cover, verification tier, expert languages, time zone, credentials, years of practice and verified flag. Seller portal has the editors on Delivery and pickup.

## Still blocked on backend (not built)
- Store paused or unavailable status in the public payload; delivery fee and minimum per area (minimum is per store).
- Expert next availability and from-price on cards; expert credentials editor in the seller portal (read-only in the customer app today).
- Per-stage order timestamps; seller rating on the order; chat response-time line.
- Verification check date and checklist for the tooltip.
- Account deletion; KYC levels and limits; support requests and chat; push registration; PDF receipts.
- Popular near you; translation hint.

## Not to build (decisions)
"Notify me" on experts, expert intro video, "Report a problem" wording (support link stays "Contact support"), seller-only chat chips (customer-visible).
