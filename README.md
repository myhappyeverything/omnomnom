# OmNomNom

Personal nutrition & health tracker — PWA frontend on Cloudflare Pages, API on Cloudflare Workers, D1/KV/R2 for storage. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the system design and cost model.

> **Note:** registration is currently open to anyone with the URL — there's no invite code, CAPTCHA, or email verification. Each new account can trigger real OpenAI Vision costs (meal photo recognition), so if you're deploying this publicly, keep an eye on usage or set a spending cap on your OpenAI account.

## Features

- Calorie/protein/carb/fat/fibre/water/weight tracking, with a weighted daily Nutrition Score
- AI meal photo recognition (OpenAI Vision) — identification only; nutrition values always come from OpenFoodFacts/USDA, never invented
- Food search across a local cache, OpenFoodFacts, and USDA, plus custom foods and recipes
- Water and weight trackers with history, streaks, and trend/goal-date projection
- Daily/weekly/monthly analytics
- Push reminders (breakfast/lunch/dinner/water/weigh-in/custom) via OneSignal, scheduled server-side per user timezone and quiet hours
- Offline logging for water and weight: mutations queue in IndexedDB when the network is unreachable, sync automatically on reconnect, and a still-unsynced entry can be deleted with no network call at all
- Settings: metric/imperial and light/dark/system preferences, full data export as JSON, restoring water/weight logs from an export, and account deletion
- Installable, offline-capable PWA (Workbox-based service worker, app-shell precaching)

## Repository layout

```
apps/
  web/      React + TypeScript + Vite PWA (frontend)
  api/      Cloudflare Worker, Hono API
packages/
  shared/   Zod schemas, domain types, and calculation logic shared by web + api
  db/       D1 schema, migrations, seed data
```

## Prerequisites

- Node.js 20+
- npm 10+
- A Cloudflare account (free tier) with Wrangler authenticated (`npx wrangler login`) — needed to deploy your own instance (see below); local dev works without it

## Getting started

```bash
npm install
npm run dev:api   # Worker on http://localhost:8787
npm run dev:web   # Vite dev server on http://localhost:5173
```

Copy `apps/api/.dev.vars.example` → `apps/api/.dev.vars` and `apps/web/.env.example` → `apps/web/.env.local`. Local dev works with placeholder secrets for everything except features that call a real third party (OpenAI, OneSignal, USDA).

## Deployment

One-time manual provisioning (D1/KV/R2/Pages/secrets, all under your own Cloudflare account — this can't be done on your behalf) is in [docs/cloudflare-setup.md](./docs/cloudflare-setup.md). Once that's done:

- **CI** ([.github/workflows/ci.yml](./.github/workflows/ci.yml)) runs lint, format check, typecheck, build, and tests on every PR and push to `main`.
- **Deploy** ([.github/workflows/deploy.yml](./.github/workflows/deploy.yml)) runs the same checks, then applies any pending D1 migrations and deploys the Worker, on every push to `main`. It needs the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets described in [docs/cloudflare-setup.md](./docs/cloudflare-setup.md#9-github-actions-deploy-access-for-stage-22).
- The frontend deploys separately via **Cloudflare Pages' own Git integration** (connected directly to this repo — see [docs/cloudflare-setup.md](./docs/cloudflare-setup.md#8-create-the-cloudflare-pages-project-frontend) for the build settings a monorepo needs). Deliberately not duplicated into the GitHub Actions workflow, to avoid two deployments racing each other on every push.

There's a single production environment — no staging cluster, matching a two-user personal app. Manual deploys work the same way from a local machine: `npm run deploy -w @omnomnom/api` for the Worker, `npm run build:web && npx wrangler pages deploy apps/web/dist --project-name omnomnom` for the frontend.

## Common scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run build`     | Build `shared`, then `web` and `api` |
| `npm run typecheck` | Typecheck every workspace            |
| `npm run lint`      | Lint the whole repo                  |
| `npm run format`    | Format with Prettier                 |
| `npm test`          | Run unit tests across workspaces     |

## Testing

`apps/api` tests run against a real, ephemeral D1 database emulated by Miniflare (`@cloudflare/vitest-pool-workers`) — not mocks. `apps/web` tests use Vitest + `@testing-library/react` + `jsdom`, with `fake-indexeddb` for the offline outbox. `packages/shared` covers the pure nutrition/scoring math. Run everything with `npm test` from the root, or `npm test -w @omnomnom/api` / `-w @omnomnom/web` / `-w @omnomnom/shared` individually.
