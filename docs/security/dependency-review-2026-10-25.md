# Dependency review, 2026-10-25

`npm audit --omit=dev` against the committed lockfile. Next.js was the only shipped runtime finding of weight and is fixed; the rest sit in build tooling or need a breaking upgrade that has its own task.

## Done in this pass

- **Next.js 16.0.10 / 16.1.6 to 16.4.3** in `api`, `office`, `seller` and the root (one version everywhere, exact pin). Closes the critical advisories (image optimizer DoS, request deserialization DoS) and the `postcss` and `sharp` findings that came with it. `tsc` and `next build` pass for all three apps; the `lockfile` diff was checked: only Next, its SWC binaries, `sharp` and `postcss` moved.
- CI now typechecks and builds `office` and `seller` and runs the API tests, so a bump like this is checked on every pull request.

## Remaining (19 findings: 1 critical, 9 high, 8 moderate, 1 low)

| Package | Severity | Where it lives | Decision |
| --- | --- | --- | --- |
| `shell-quote` (critical) | critical | `react-devtools-core`, a React Native dev tool | Not in any shipped app. Resolves when React Native moves its dependency. Do not run `npm audit fix`: its plan downgrades dozens of packages across the Expo tree |
| `@expo/cli`, `@expo/code-signing-certificates`, `node-forge`, `js-yaml`, `picomatch`, `source-map-js`, `expo` (high) | high | Expo build tooling | Developer and build machines only, not the app runtime. Revisit at the next Expo SDK upgrade; keep builds on trusted machines or EAS |
| `ws` 7.5.13 / 8.x (high) | high | Metro and dev server | Dev server only |
| `zod` (high) | high | Was an unused direct dependency of `api` (nothing imports it); removed. What remains is a transitive of `eslint-plugin-react-hooks`, lint tooling only | Resolves with the next `eslint-config-next` bump |

## Deprecation warnings

- NativeWind triggers React Native's `ImageBackground is deprecated` warning. `mobile/lib/dev-warning-filter.ts` hides it in development only. Revisit when NativeWind updates.
- `expo-notifications` logs a Keychain error on the iOS simulator (no entitlement); hidden the same way in development, real on a device build (plan item H4).

## Rules going forward

- Install with `npm ci` from the repo root. `.npmrc` sets `legacy-peer-deps=false` so a global setting cannot hoist React Native next to React 18.
- Re-run `npm audit --omit=dev` before each release and date the result here.
