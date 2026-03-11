# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Subjecto

A minimalistic, zero-dependency TypeScript state management library. Two core primitives: `Subject<T>` (flat reactive values) and `DeepSubject<T>` (proxy-based nested object observation with path subscriptions). Published as npm package `subjecto`.

## Commands

- **Build:** `npm run build` (uses tsup)
- **Test:** `npm test` (Jest with ts-jest, jsdom environment)
- **Run single test:** `npx jest --testPathPattern <pattern>` (e.g. `npx jest --testPathPattern subject`)
- **Lint:** `npm run lint` (ESLint with flat config, typescript-eslint)
- **Check bundle size:** `npm run size`

## Architecture

### Entry points (configured in `tsup.config.ts`)

The library ships 5 separate entry points for tree-shaking:

| Entry | Source | Purpose |
|-------|--------|---------|
| `subjecto` | `src/index.ts` | Full bundle: Subject + DeepSubject |
| `subjecto/core` | `src/core.ts` | Subject only (smallest bundle) |
| `subjecto/helpers` | `src/helpers.ts` | Standalone helper functions (nextAssign, nextPush, toggle, once, complete) |
| `subjecto/debug` | `src/debug.ts` | Debug UI overlay for visualizing state changes |
| `subjecto/react` | `src/react/index.ts` | React hooks: useSubject, useDeepSubject, useDeepSubjectSelector |

### Core classes

- **`Subject<T>`** (`src/subject.ts`): Simple observable value. Subscribers notified on `next()`. Supports `before` transform, `debug` mode, `once`, `toggle`, `nextAssign`, `nextPush`. Uses `Symbol` keys for subscription IDs.

- **`DeepSubject<T>`** (`src/deepSubject.ts`): Proxy-based deep observation. Subscribers use slash-separated path patterns (`"user/name"`, `"cart/items/**"`, `"*"`, `"**"`). Path matching supports exact, single-wildcard (`*`), and recursive-wildcard (`**`) with memoized matching. Array mutations (push, pop, splice, etc.) are intercepted via proxy.

### React integration (`src/react/`)

- `useSubject` wraps `Subject` with `useSyncExternalStore`
- `useDeepSubject` subscribes to a type-safe path on `DeepSubject` using `useSyncExternalStore`
- `useDeepSubjectSelector` adds a selector/transform layer with memoization (JSON.stringify comparison for objects)
- Type-safe paths via `Paths<T>` and `PathValue<T, P>` utility types in `src/react/types.ts`

### Build

Dual ESM/CJS output via tsup. TypeScript declarations generated. React is an external peer dependency. `process.env.NODE_ENV` is replaced at build time—dev-only code (debug logs, error messages) is stripped in production.

### Tests

Tests live in `src/__tests__/`. Coverage is collected for `src/subject.ts`, `src/deepSubject.ts`, and `src/react/**/*.ts`. Jest uses `@/` path alias mapped to `src/`.
