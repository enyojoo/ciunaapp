#!/usr/bin/env python3
"""Writes components/<Name>/README.md from the table below. Hand-edit a README afterwards and delete its row here."""
import os
root = os.path.join(os.path.dirname(__file__), "..", "components")
C = [
 ("Button","Triggers the one action a screen is about.","Label (sentence case, names the action), optional leading icon, spinner when busy.","default (orange fill, ink label), secondary (surface, input-edge border), ghost, destructive (destructive fill, white label), link (primary-text). Hover/press: primary-hover. Focus: 3px ring. Disabled: 50% and no pointer. Busy keeps full colour.","Min height 48 on touch, 40 on dense desktop. One default button per screen. Never white label on orange.","Web/Office `Button` hover was `primary/90` with white label; now `primary-hover` with ink. Expo `PrimaryButton` uses `colors.onPrimary`.","packages/ui-web/src/button.tsx"),
 ("Input","Single-line text entry.","Label above, field, helper or error below, optional prefix/suffix.","default, focus (ring), filled, error (destructive-text + icon), disabled, read-only.","Edge uses input-edge (3:1). Placeholder is subtle and never carries the label. Numeric fields use inputMode and tabular numerals.","Merge Expo `Field`/`AppTextInput` and web `Input` behaviours.","packages/ui-web/src/input.tsx"),
 ("Textarea","Multi-line text.","Label, field, character count when limited, helper/error.","Same as Input.","Auto-grows to 8 rows then scrolls.","New shared.","packages/ui-web/src/textarea.tsx"),
 ("Select","Choose one from a list.","Label, trigger, listbox (desktop) or bottom sheet (phones).","default, open, disabled, error.","Currency pickers show flag + code; other pickers show plain labels.","Use sheet on phones for Seller.","packages/ui-web/src/select.tsx"),
 ("Switch","On/off setting that applies immediately.","Track, thumb, label.","on, off, disabled, busy.","Unchecked track uses input-edge. Label states the on-state: 'Accepting orders'.","New shared.","packages/ui-web/src/switch.tsx"),
 ("StatusBadge","One word status in one colour pair.","Dot or icon + word.","Tones: success, warning, destructive, neutral. Map by status word, never by caller colour.","Word list is in README principles. Never orange. Never colour alone.","Replaces the ad-hoc status colours in web and mobile `status-chip`.","packages/ui-web/src/status-badge.tsx"),
 ("Amount","The only way money is rendered.","Symbol, whole, cents (smaller at display sizes), optional sign.","Sizes: display (cents 60%), large (80%), body. Positive, negative (true minus), muted.","Follows README money rules; zero-minor-unit currencies never show decimals; tabular figures; large values step down, never clip.","Port easnerbanking `Amount`; shared `formatMoney` already in packages/shared.","packages/ui-web/src/amount.tsx"),
 ("Card","Groups related content on a plate.","Optional header (title + action), body, optional footer.","default (surface, hairline border), interactive (hover shadow, focus ring), selected (primary-tint + primary-border).","Radius 16, padding 16 phone / 24 desktop. Never nest cards more than once.","Existing shadcn Card; add selected state.","packages/ui-web/src/card.tsx"),
 ("DataTable","Dense lists in Office and Seller desktop.","Sticky header, sortable columns, row actions, selection, pagination, empty/loading rows.","loading skeleton rows, empty, error with retry, row hover, selected.","Money right-aligned tabular. Under 768px in Seller it renders as stacked cards.","New shared; replaces per-page tables in Office.","packages/ui-web/src/data-table.tsx"),
 ("EmptyState","Tells the user what to do when a list is empty.","Icon, title, one sentence, one action.","first-use, filtered-empty, error.","Title says what's missing; action says how to fix it.","Expo `EmptyState` exists; add web version.","packages/ui-web/src/empty-state.tsx"),
 ("PageHeader","Title block for every Seller/Office page.","Title, optional description, breadcrumb on desktop, primary action right.","default, with tabs.","On phones the primary action moves into the sticky bottom bar.","New shared.","packages/ui-web/src/page-header.tsx"),
 ("AppShell","Seller and Office frame.","Sidebar, top bar, content, mobile bottom nav.","expanded sidebar, compact, mobile.","See guides/30-seller.md and 40-office.md.","New.","seller/components/shell"),
 ("StoreCard","A store in the customer catalog.","Cover, logo, name, verified badge, rating, delivery info.","default, closed (muted + 'Opens 9:00'), paused hidden.","Closed stores stay visible but can't be added to.","New; today only a plain vendor chip exists.","web/components/hub, mobile/components/store-item.tsx"),
 ("ExpertCard","An expert in the directory.","Photo, name, headline, languages, rating, from-price.","default, unavailable.","Languages shown as flags/codes the viewer can filter by.","Extend existing expert catalog card.","web/components/hub/hub-expert-catalog-card.tsx"),
 ("OrderCard","A seller's order in a list or board.","Order number, age, items summary, total, fulfilment chip, SLA timer, next action.","new (amber, SLA running), accepted, preparing, ready, done; overdue turns the timer destructive-text.","One next action per card. Reject lives in the detail.","New in Seller.","seller/components/orders"),
 ("OrderTimeline","The customer's and seller's shared view of an order.","Stages with times and actors.","completed, current, upcoming, cancelled.","Stage names match StatusBadge words.","Extends existing transaction-timeline.","web/components/transaction-timeline.tsx"),
 ("ListingEditor","Create or edit a product or service.","Sections: basics, media, pricing, variants/stock, fulfilment, per-language copy, visibility.","draft autosave, validation, in-review banner, live.","Language tabs; default language required; sticky Save/Discard.","New in Seller.","seller/components/catalog"),
 ("AvailabilityEditor","Weekly hours + exceptions for experts.","Day rows with ranges, time zone, buffer, notice, time-off list.","default, conflicts, preview of generated slots.","Shows the next 14 days of slots as preview.","New in Seller.","seller/components/availability"),
 ("EarningsTile","Balance and period figures.","Label, Amount, delta, help text.","pending, available, paid out.","Always states what 'pending' waits for.","New in Seller.","seller/components/earnings"),
 ("OnboardingChecklist","Guides a new merchant to live.","Steps with state and one CTA each.","not started, in progress, done, blocked by review.","Shows what Office is reviewing and the expected turnaround.","New in Seller.","seller/components/onboarding"),
 ("FileDrop","Upload documents and images.","Drop zone, camera/gallery on phones, progress, preview, remove.","idle, dragging, uploading, error, done.","Images crop to 4:3; documents allow PDF/JPG/PNG up to 10MB with clear errors.","New shared.","packages/ui-web/src/file-drop.tsx"),
 ("LanguageTabs","Edit listing copy per language.","Tabs for en ru fr es zh pt with filled indicator.","default, missing translation, machine-translated badge.","Default language is required; others optional.","New shared.","packages/ui-web/src/language-tabs.tsx"),
]
for name,purpose,anatomy,states,rules,upgrade,code in C:
    d=os.path.join(root,name); os.makedirs(d,exist_ok=True)
    open(os.path.join(d,"README.md"),"w").write(f"""# {name}

## Purpose
{purpose}

## Anatomy
{anatomy}

## States
{states}

## Rules
{rules}

## Upgrade
{upgrade}

## Code
`{code}`
""")
print(len(C),"specs")
