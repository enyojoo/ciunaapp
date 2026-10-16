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
Differs from the built app: store, product and expert favourites with tabs and the Undo toast are New; the signed-out prompt is New. Today only a product heart exists on cards.

## Code
To be built: `mobile/app/(app)/favourites.tsx`, `web/components/favourites/*`
