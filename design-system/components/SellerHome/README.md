# SellerHome

## Purpose
The seller's landing screen. It answers "what needs me now?" first (new orders, in progress, a short to-do list) and "how am I doing?" second (today's earnings). Before approval it turns into the setup checklist.

## Anatomy
- Page header: "Welcome, {store name}" and one line of help.
- Live: two tiles (New orders, linked to Orders, with "Waiting for you to accept"; In progress), a "Needs you" list (accept orders, reply to a customer, low stock, expiring document), and a Today's earnings card (net as the headline, gross, Ciuna fee and net below, link to Earnings).
- Setup (draft or rejected): "Get ready to sell" card with a progress bar, six checklist rows (Done or To do, never icon colour alone) and a Continue setup button.
- Status banner above the page: draft, in review, rejected, suspended, paused. Live stores show none.
- Phones: top bar with store switcher, bottom nav of Home, Orders, Messages, Catalog, More. Desktop: 248px sidebar.

## States
Live; setup (draft); rejected and in review (same page, banner changes); suspended; paused (banner with Resume selling, counts at zero); first load (skeleton for the header and tiles; cached content is never replaced by a skeleton); permission-limited (only the tiles the role may see).

## Rules
- Leads with actions, numbers second. One primary button per screen: Continue setup in setup, Resume selling in the paused banner.
- Money: the headline is `₽8,460` (no cents); the breakdown keeps cents and a true minus: `−₽940.00`.
- Banners say what to do next; Rejected and Suspended show Ciuna's reason.
- Counts refresh every 30 seconds. The to-do list is ordered by urgency, accept first.

## Upgrade
Partly built in `seller/app/(shell)/page.tsx` and `seller/components/shell/app-shell.tsx` (live tiles, setup checklist, all five banners). New in this design:
- The "Needs you" to-do list and the Today's earnings card (the built Home has only the two count tiles).
- Checklist progress bar and Done/To do badges (built shows an icon and the label).
- A real skeleton on first load (built shows "–" in the tiles).
- Role-aware tiles: the built page still renders the orders tile with "–" for roles without the orders permission; hide it instead.
- Expert variant (bookings) is not drawn here; it follows `SellerBookings`.

## Code
`seller/app/(shell)/page.tsx`
