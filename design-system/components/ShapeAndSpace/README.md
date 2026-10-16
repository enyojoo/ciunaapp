# ShapeAndSpace

## Purpose
Radii, shadows, spacing, tap targets, breakpoints, motion and focus: the shape language shared by every surface.

## Anatomy
Radii: control 12, card 16, sheet 24, pill 999. Shadows: xs, sm, md, lg, card-face. Spacing on a 4px grid (4, 8, 12, 16, 20, 24, 32, 48); page gutter 20. Tap target 48. Breakpoints sm 640, md 768, lg 1024, xl 1280. Motion: fast 150ms, sheet 180ms, normal 220ms. Focus ring 2 to 3px `primary`, 2px offset.

## States
Focus: visible ring. Pressed: `primary-hover` and no shadow change. Reduced motion: movement replaced by a fade. Selected: `primary-tint` fill with `primary-border`, not the focus ring.

## Rules
- Cards use a 1px `hairline` edge; shadows mean "above the page" (menus, sheets, dialogs).
- Spacing stays on the 4px grid. Inner radius never exceeds outer radius minus padding.
- Touch targets are 48 × 48 minimum with 8px between them; controls are 44 tall on web.
- Animate only opacity and transform. Respect Reduce Motion. No count-up on money.
- The focus ring is never removed and meets 3:1.

## Upgrade
Radii, shadows and motion are generated from `tokens.json`. Seller and Office still use some one-off radii (8, 10, 14) to migrate to control or card.

## Code
`design-system/tokens.json` (`radius`, `shadow`, `space`, `motion`, `breakpoint`)
