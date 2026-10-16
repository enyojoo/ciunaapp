# SearchResults

## Purpose
One search across products, stores and experts.

## Anatomy
Back button and rounded search field; chips (All, Products, Stores, Experts) once results show; Recent searches (device-local, Clear) and Popular near you chips on open; suggestion rows while typing; grouped results with section headers and See all; rows with thumbnail or avatar, title, line, price or rating.

## States
Opened; typing (suggestions); results grouped (a group is omitted when empty); no results ("No results for ...", spelling hint, Try instead chips); too short (hint under two characters); loading skeleton rows; offline (cached recent searches only, with a neutral banner).

## Rules
Minimum two characters. Matches are highlighted in bold, never colour alone. Result rows are 56px+ tap targets. Search is localised: titles match in the viewer's language and the seller's original. Closed or sold-out items still appear with their status.

## Upgrade
New. Today the customer app has no global search; Food and Mart have no search field either (see FoodHome).

## Code
To be built: `mobile/app/(app)/search.tsx`, `web/components/search/*`
