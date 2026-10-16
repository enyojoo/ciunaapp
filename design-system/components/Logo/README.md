# Logo

## Purpose
How the Ciuna wordmark and mark are drawn, spaced, sized and placed.

## Anatomy
Three files in `design-system/assets/logos/`: `ciuna.svg` (wordmark and mark, logo orange `brand-primary`), `ciuna-white.svg` (all white), `ciuna-mark.svg` (the four-circle mark alone). Clear space `x` = one circle diameter (about 44% of logo height) on all sides. App icon: mark on a rounded tile, corner radius 22%.

## States
Backgrounds: orange logo on paper, white or `primary-tint`; white logo on ink and on `primary` only. Minimum size: wordmark 22px high, mark 16px high. Loading may pulse the mark (opacity only).

## Rules
- Use the supplied files. Never stretch, recolour, rotate, outline or add shadows.
- Never the orange logo on `primary` or ink; never the white logo on a light surface.
- The logo orange is for the logo and illustration only, never for buttons or small text.
- Do not place the mark beside the wordmark; the wordmark already contains it.
- Documents and email: logo top-left on white. Seller and Office show the Ciuna logo plus the business avatar, never replace it.

## Upgrade
Customer app header uses the 22px wordmark today. Add the white tile app icon and the favicon set at 16, 32 and 180px.

## Code
`design-system/assets/logos/`, `web/public/`, `app/assets/`
