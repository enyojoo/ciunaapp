# Implementation plan

Authoritative sequence is `docs/seller-portal-and-design-system-plan.md`. Design-system tasks:

1. Tokens + sync + contrast check (done: `npm run design:sync`, `design:check`).
2. Web, Office and Expo consume the generated tokens (done); remove remaining `text-white` on orange fills (customer web heroes still use orange gradients with white text: replace with `paper` + tile layout).
3. `packages/ui-web`: shared Button, Input, Textarea, Label, Select, Switch, Checkbox, Badge/StatusBadge, Card, Tabs, Dialog, Sheet, Skeleton, Toast, Amount, DataTable, EmptyState, PageHeader, Stepper, FileDrop. Seller uses it from day one; web and Office migrate screen by screen.
4. Component specs under `components/` before each is built.
5. Add `zh` and `pt` locales.
6. Replace `DESIGN.md` colour table with a pointer here.
