# Current store card (Expo), extracted from `mobile/components/store-item.tsx`

Two sizes share one face (`StoreFace`):

- **Strip** (rail on Food/Mart home): fixed width 120. **Grid**: width 48.5% of the row, 12px below.
- Shell: radius 16, 1px `hairline` border, `surface` background, shadow `{opacity .06, radius 8, offsetY 2, elevation 2}`, overflow hidden.
- Photo: square (1:1), well `paper`, image fills. No photo: centred 11px/600 muted store name (2 lines).
- Caption under a hairline top border.
  - Strip caption: padding 8, name 12px/600 centred, 1 line.
  - Grid caption: padding 12, name 13px (`type.meta`)/600 left, line height 18, 1 line.
  - Name row: gap 4; verified check (`BadgeCheck` 12px primary, stroke 2.2) after the name when verified.
  - Location (grid only): 4px above, `MapPin` 12px muted, then 11px/15 muted text, 1 line.
- No rating, hours, delivery info, closed state or favourite today (all New on the `StoreCard` card).
- Skeletons: strip aspect 0.82, grid aspect 0.85, `paper` fill, radius 16.

Improvement candidates: show rating and hours or "Opens 9:00" in the caption; delivery fee and time; closed dim state; favourite heart on the photo corner; square photo crops brand logos, consider a cover image with a logo badge on stores that have one.
