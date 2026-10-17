# SectionHeader

## Purpose
Titles a block of content on a customer screen and offers one text action for the whole block ("See all").

## Anatomy
Title (headline, 20, semibold) on the left. Optional text action (label, 15, `primary-text`) on the right. 12 below, 24 above the next block.

## States
title only, title with action, long title (ellipsis, action stays), pressed action (selection haptic).

## Rules
- One action per header and it names the destination ("See all stores"), never "More".
- Not used for the screen title: that is the large title in the header.
- Sentence case. Action tap target is 44 with hit slop.
- Marked as a heading for screen readers.

## Upgrade
Replaces ad-hoc 18 to 22 pt titles with local "See all" styles on Food, Mart, Experts and Home. One component and one size.

## Code
`mobile/components/ui/section-header.tsx`
