# CommunityPicker

## Purpose
Lets a customer find stores that serve their community (Nigerian, Chinese, Indian and so on) on Food and Mart.

## Anatomy
Pill in the header next to the city pill, same 36 high look. Opens a bottom sheet with "All communities" and one row per community, a check on the chosen one. Communities are set by sellers on their store profile and edited by Office.

## States
all communities, community chosen, sheet open, a filter that leaves no stores (empty state with a clear action).

## Rules
- One community at a time; "All communities" clears it.
- Only communities that at least one store has set are offered where the list is long; the full set lives in `packages/shared`.
- Community names are translated in every language and never use a flag.
- Combining with the city filter narrows the result; the empty state says so and offers to clear.

## Upgrade
New in this release. Sellers set communities in Seller > Store profile.

## Code
`mobile/components/community-picker.tsx`, `mobile/lib/community.ts`, `packages/shared/src/hub/communities.ts`
