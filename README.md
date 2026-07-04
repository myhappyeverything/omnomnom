# Purple

Personal nutrition & health tracker — PWA frontend on Cloudflare Pages, API on Cloudflare Workers, D1/KV/R2 for storage. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the system design and cost model.

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
- A Cloudflare account (free tier) with Wrangler authenticated (`npx wrangler login`) — needed from Stage 6 onward

## Getting started

```bash
npm install
npm run dev:api   # Worker on http://localhost:8787
npm run dev:web   # Vite dev server on http://localhost:5173
```

Copy `apps/api/.dev.vars.example` → `apps/api/.dev.vars` and `apps/web/.env.example` → `apps/web/.env.local`. Local dev works with placeholder secrets for everything except features that call a real third party (OpenAI, OneSignal, USDA).

To deploy your own instance to Cloudflare, follow [docs/cloudflare-setup.md](./docs/cloudflare-setup.md) — it provisions D1/KV/R2/Pages under your own account (this can't be done on your behalf; it needs your Cloudflare login).

## Common scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run build`     | Build `shared`, then `web` and `api` |
| `npm run typecheck` | Typecheck every workspace            |
| `npm run lint`      | Lint the whole repo                  |
| `npm run format`    | Format with Prettier                 |
| `npm test`          | Run unit tests across workspaces     |

## Status

This project is being built in stages (see `ARCHITECTURE.md` §"Development approach" in the original spec). Current progress is tracked in-session; the deployment guide and full environment variable reference land in the final stages.
