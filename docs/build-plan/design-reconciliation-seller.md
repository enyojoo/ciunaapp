# Seller: where the built app is better than, or ahead of, its design card

Rule (guides/80-decisions.md, "the current product wins over a weaker card"): compare first, adopt a card element only when it is clearly better. This file lists, per screen, what the app already does better or differently and what the card should change to. Cards are then updated from this log ("Current" frame faithful to the app, "Improved" frame for the additions that were adopted).

Adopted from the cards in this pass (so they are no longer differences): Home "Needs you" and Today's earnings, StatTile, setup progress bar and Done/To do badges, DueTimer warning state, order card booking slot and rejected reason, desktop order board, order detail two columns from 1024px, phone action bar on one row, reject sheet refund amount, EarningsTile hero and Available tint, FeeBreakdown rule name and reversed state, payouts two-column grid and paid time with zone, Default badge and Ciuna Send row, product editor two columns and Visibility card, import phone cards, fulfilment "What this unlocks" and banners, messages split view, review edit-window and locked note, More groups with hints, desktop top bar, styled business switcher.

## Differences where the app wins

| Screen | Card | What the app does better | What the card should change to |
| --- | --- | --- | --- |
| SellerOrders / OrderCard | Draws a **Ready** column and a **Rejected** status | The order state machine has New, Accepted, Preparing, Completed and Cancelled only; a reject is a cancel with a reason. The board is built with three columns (New, Accepted, Preparing). | Remove the Ready column and the separate Rejected badge; show a rejected order as Cancelled with the reason line. Add Ready only if the state machine gets it. |
| OrderCard | Primary button reads "Accept order" | The built label is the single word "Accept" on the card (bookings: "Accept booking"). At 375px the amount and button share a row and the longer label wraps on long locales (ru, fr). | Use "Accept" / "Accept booking" on the card; keep "Accept order" only where there is room (detail header). |
| SellerWithdraw / WithdrawSheet | Minimum shown as a hint inside the amount field | The built sheet shows "Available · Minimum" under the field next to Withdraw all, plus a live fee preview, a currency picker for multi-currency sellers and a banner with a Manage methods link when the only method is unverified. | Redraw the field hint as the built line under the field, add the currency picker, preview and unverified banner states. |
| PayoutMethods / AddMethodSheet | Type choice as three large rows | The built type select already disables Ciuna Send with "Coming soon" and switches the currency to RUB for SBP. | Keep the Select as the Current frame; the row version stays only as the disabled Ciuna Send row in the list (built now). |
| SellerMessages | Day separator and Seen listed as New | Both are built (`messages/[orderId]/page.tsx`), together with quick replies that fill the composer without sending and the 2000 counter that appears at 1800. | Mark them Built. Only the desktop split view was New (built now). |
| SellerReviews / ReviewReplyCard | Reply counter and edit window listed as New | The reply sheet already has the used / 600 counter, an over-limit banner and the edit-window hint; the API already returned `reply_editable`. | Mark counter and over-limit state Built; the hours-left note and locked note are the additions (built now). |
| SellerCatalog | Desktop row layout only from 1280px | Same as the card, but between 768 and 1279px the row stacks into a tall card. The app should use `lg` (1024px) for the row layout, which it can once the sidebar width is accounted for. | Draw the 1024px row layout and a 768px tablet stack. |
| SellerProductEditor | Save as draft / Publish in the sticky bar plus a Visibility card | The two bar buttons are the clearer control for "go live now"; the Visibility switch duplicates them. Built keeps both and ties the primary button to the switch (off means the primary saves as draft). | Draw the bar with the primary button label following the switch state (Publish, Save changes, Save changes (hidden)). |
| SellerShellStates | Business switcher is a styled list on desktop and a sheet on phones | Built uses one sheet for both. A native select was dropped, so there is no OS picker on phones. | Draw the sheet on desktop too (centred dialog at sm and up) or add a desktop popover frame. |
| SellerHome | Role-aware tiles listed as New | The page hides the orders tile and every card section the role may not see; documents row only for roles with the documents permission. | State the per-role rules (owner, manager, staff, finance) on the card. |
| SellerEarnings | "You earn" label in the phone statement card | The built row says **You earn**; reversed rows say **You keep ₽0.00** with a note (FeeBreakdown wording). | Use "You earn" on the row and "You keep" only inside FeeBreakdown. |
| SellerMore | Rows show a right-hand hint | The built page draws hints only when the data exists (rating, available balance, default method, team count) and never a placeholder. | Add a state frame with hints missing (loading) so cards do not imply a skeleton. |

## Not built because the card is ahead of the product (needs a decision, not a design change)

- Search in the desktop top bar (decision D2 in `seller.md`).
- Listing health card on ListingEditor (D4).
- Expert credentials, languages spoken, intro video (D5).
- Customer time zone on bookings (the seller sees the service zone and the device zone).
