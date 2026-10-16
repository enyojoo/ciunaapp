# Favourites

## Purpose
A shortcut list of the stores, products and experts a customer saved.

## Anatomy
Title; segmented tabs Stores, Products, Experts; stores as rows (logo, name, verified, rating, cuisine, delivery), products as a two-column grid with hearts, experts as rows (avatar, name, role, languages, rating); filled heart on each item removes it; an Undo toast after removing.

## States
Stores, Products, Experts with items; empty tab (heart icon, one sentence, a button to Food or Experts); signed out (Sign in and Create account); loading skeleton rows; offline shows the cached list read-only.

## Rules
The heart is both the toggle and the state: filled orange-text colour when saved, outline otherwise. Removal never asks for confirmation; it offers Undo. Unavailable items stay listed, muted, with their status. Favourites follow the account across devices.

## Upgrade
Built in `mobile/app/favourites.tsx`: tabs Stores, Products, Experts; stores and experts as rows (`list-rows.tsx`), products as a grid; filled heart removes with an Undo toast; empty, skeleton and error states. Not built: offline read-only list beyond the cached data.

## Code
To be built: `mobile/app/(app)/favourites.tsx`, `web/components/favourites/*`
