# SellerProfile

## Purpose
Let a store or expert edit what customers see on their page.

## Anatomy
Basics (name, language tabs with default marker and status dots, description); Images (logo, cover); Contact and region (email, phone, website, currency, country, operating country). Expert adds Credentials, Languages spoken and Intro video. Sticky save bar (desktop bottom bar with Discard, phone bar above the nav).

## States
Desktop store and expert; phone in Russian; scrolled phone with sticky Save; unsaved changes; missing translation dot.

## Rules
Default language is required, others optional. Unsaved changes are named. Credentials show Verified or In review.

## Upgrade
Store profile is built in seller/app/(shell)/profile/page.tsx. Not built: the expert extras (credentials, languages spoken, intro video), the Discard button and unsaved note.

## Code
seller/app/(shell)/profile/page.tsx
