# StoreCard

## Purpose
A store in the customer catalog.

## Anatomy
Cover, logo, name, verified badge, rating, delivery info.

## States
default, closed (muted + 'Opens 9:00'), paused hidden.

## Rules
Closed stores stay visible but can't be added to.

## Upgrade
New; today only a plain vendor chip exists.

## Code
`web/components/hub, mobile/components/store-item.tsx`
