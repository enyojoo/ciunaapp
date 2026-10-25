# DirectoryFilters

## Purpose
The same search and filters on every "All" list (All stores, All products, All experts), so a long list can be narrowed the same way everywhere.

## Anatomy
Search box (48 high, 12 radius, hairline) on top, a row of filter chips under it (All, Open now, Delivers, Online, In person depending on the list), then a count ("24 stores") with a "Clear" action on the right.

## States
default, searching, a filter on, no match (title, body, clear action), loading (skeleton rows).

## Rules
- Filters differ by list but the search box, chips, count and clear sit in the same place.
- The count always shows the number after filtering. "Clear" appears only when something is filtered.
- Chips scroll sideways; the first chip is always "All".
- The header city and community pills filter the same list; the empty state names both.

## Upgrade
Replaces separate search patterns on the stores and experts lists.

## Code
`mobile/components/directory-filters.tsx`
