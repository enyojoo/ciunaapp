# OfficeMarketplace

## Purpose

Control what customers see on the home screen: which service tiles, in what order, with what words in each language.

## Anatomy

- Tile list: drag handle, position, icon, name, subtitle, On and Off switch (Food, Mart, Send, Experts, Learn).
- Customer preview of the home screen.
- Copy editor: title and subtitle per language with limits and completeness note.
- Publish changes with unpublished count.

## States

- On, Hidden (dimmed, neutral badge).
- Unpublished changes banner.
- Missing languages fall back to English and are listed.
- Turning off a line with dependants is blocked and says what to remove.

## Rules

- Customers see the published version only.
- Turning a line off hides it; existing orders continue.
- At least one tile must stay on.
- Only ops and super_admin edit; changes are in the audit log.

## Upgrade

Built: a marketplace page that lists catalog items. New: home tile configuration, ordering, per-language copy and publish.

## Code

office/app/marketplace, office/components/hub
