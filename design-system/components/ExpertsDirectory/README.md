# ExpertsDirectory

## Purpose
How a customer finds a professional who speaks their language: lawyers, tutors, translators, tax advisers and other verified experts.

## Anatomy
- Title and one muted line.
- SearchField (name, headline, service words).
- Language chips (All languages, English, Русский, Français, Español, 中文, Português; the row scrolls sideways on phones).
- Category chips (All, Legal, Language, Translation, Tax, Health).
- Result count and Clear filters when anything is filtered.
- ExpertCard list: round photo, name with the verified tick, headline, spoken languages, rating with review count, "From ₽3,500". The whole card opens the profile.
- Desktop: the same filters in a row, cards in a three-column grid.

## States
Default, Filtered (count plus Clear filters), No match ("No experts match", Clear filters), Loading (card skeletons on a true first load), Error ("Couldn't load experts" with Retry), Offline (cached list with a quiet "Offline" line). Only published, verified experts appear; an expert who unpublishes disappears from the list at once.

## Rules
- Language and category chips combine: language AND category.
- The first language chip is the viewer's app language when experts speak it.
- Prices are the lowest active service price in RUB; sessions are online unless the card says "In person".
- A card never shows a rating until there is at least one review ("New" chip instead).
- Names and headlines accept any script.

## Upgrade
Built in `mobile/app/experts/browse.tsx`: search, category chips, language chips, result count, Clear filters, loading skeleton, empty, no-match and retry states.

## Code
`mobile/app/experts/index.tsx`, `mobile/app/experts/browse.tsx`, `web/components/hub/expert-*.tsx`
