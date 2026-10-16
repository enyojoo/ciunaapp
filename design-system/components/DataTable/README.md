# DataTable

## Purpose
Dense lists in Office and Seller desktop.

## Anatomy
Sticky header, sortable columns, row actions, selection, pagination, empty/loading rows.

## States
loading skeleton rows, empty, error with retry, row hover, selected.

## Rules
Money right-aligned tabular. Under 768px in Seller it renders as stacked cards.

## Upgrade
New shared; replaces per-page tables in Office.

## Code
`packages/ui-web/src/data-table.tsx`
