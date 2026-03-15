# AGENTS.md

## Cursor Cloud specific instructions

**MelodyType** is a fully client-side typing practice web app (React 19 + TypeScript + Vite 8 + Tailwind CSS 4). There is no backend, no database, and no external API — all data is stored in the browser's IndexedDB via Dexie.js.

### Running the app

- `pnpm dev` — starts Vite dev server on port 5173 (add `--host 0.0.0.0` for external access)
- `pnpm build` — runs `tsc -b && vite build` (production build to `dist/`)
- `pnpm preview` — serves the production build locally

### Lint / Type-check / Build

- `pnpm lint` — ESLint. Note: the codebase has pre-existing lint errors (e.g. `react-refresh/only-export-components`, `react-hooks/set-state-in-effect`). These are not regressions.
- `tsc -b` — TypeScript type-check (part of `pnpm build`)
- No automated test suite exists (no `test` script in `package.json`).

### Key caveats

- Package manager is **pnpm** (lockfile: `pnpm-lock.yaml`).
- The `msw` dependency has an ignored build script; pnpm will warn about it. This is harmless.
- No `.env` file is needed — the app has zero environment variables.
- Path alias `@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`).
