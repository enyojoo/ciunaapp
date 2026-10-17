# StickyActionBar

## Purpose
Keeps the one action of a screen in reach while the content scrolls: Add to cart, Checkout, Pay, Continue, Book.

## Anatomy
Surface bar with a hairline top edge and a soft upward shadow. Optional summary line (13, muted) above one full-width button (48 or 56). 12 padding, 16 side gutter, bottom padding follows the home indicator.

## States
default, with summary line, busy (button spinner, label width kept), disabled with a reason line, above the tab bar (bottom padding 12, tab bar owns the inset), keyboard open (bar rides above the keyboard).

## Rules
- One primary button. A second action is a ghost link in the summary line, never a second filled button.
- Shows the total in the button when money moves: "Pay ₽1,100".
- Scroll content gets about 96 of bottom padding so the last row clears the bar.
- A disabled button says why in the summary line ("Choose a delivery area").
- Hidden on screens with no single obvious next action.

## Upgrade
Replaces the inline Add to cart button on the product page, the Checkout button on Cart, and the Continue buttons in Send and booking, which scroll away or float inconsistently today.

## Code
`mobile/components/ui/sticky-action-bar.tsx`
