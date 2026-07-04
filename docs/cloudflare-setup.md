# Cloudflare setup

This provisions the real Cloudflare resources the app needs. It's a one-time,
per-account setup — none of it can be done on your behalf without your
Cloudflare login, so these are commands for you to run locally.

Everything here stays on Cloudflare's free tier for a two-user app (see
[ARCHITECTURE.md](../ARCHITECTURE.md#13-cost-model-why-this-stays-near-0)).

## 0. Prerequisites

- A Cloudflare account (free tier is enough): https://dash.cloudflare.com/sign-up
- Node.js 20+ and this repo's dependencies installed (`npm install` at the root)

Unless noted otherwise, run `npx wrangler ...` commands from `apps/api` (where
`wrangler.toml` lives) and `npm run ...` commands from the repo root (where
the workspaces are defined).

## 1. Log in

```bash
cd apps/api
npx wrangler login
```

This opens a browser to authorize Wrangler against your account.

## 2. Create the D1 database

```bash
npx wrangler d1 create omnomnom-db
```

Copy the `database_id` from the output into [`apps/api/wrangler.toml`](../apps/api/wrangler.toml),
replacing `REPLACE_WITH_D1_DATABASE_ID`.

Apply the schema:

```bash
npm run db:migrate:remote -w @omnomnom/api   # applies packages/db/migrations to the real D1 instance
npm run db:migrate:local -w @omnomnom/api    # keep local dev in sync too
```

## 3. Create the KV namespace

```bash
npx wrangler kv namespace create CACHE
```

Copy the `id` into `wrangler.toml`, replacing `REPLACE_WITH_KV_NAMESPACE_ID`.

## 4. Create the R2 bucket

```bash
npx wrangler r2 bucket create omnomnom-meal-images
```

The bucket name in `wrangler.toml` already matches (`omnomnom-meal-images`) —
no further edit needed unless you chose a different name.

## 5. Set secrets

These must never appear in `wrangler.toml` (which is committed to git). Each
command prompts for the value interactively:

```bash
npx wrangler secret put JWT_SECRET             # generate with: openssl rand -base64 48
npx wrangler secret put OPENAI_API_KEY         # platform.openai.com/api-keys
npx wrangler secret put ONESIGNAL_REST_API_KEY # onesignal.com app settings -> Keys & IDs
npx wrangler secret put USDA_FDC_API_KEY       # fdc.nal.usda.gov/api-key-signup.html
```

## 6. Set the non-secret production vars

Edit `wrangler.toml` directly (these are safe to commit):

- `ONESIGNAL_APP_ID` — from the same OneSignal app settings page as the REST key above.
- `ALLOWED_ORIGIN` — the exact origin your frontend will be served from. You
  won't know this until Step 8 creates the Pages project; come back and set
  it (then redeploy the Worker) once you do.

## 7. Deploy the Worker

```bash
npm run deploy -w @omnomnom/api
```

## 8. Create the Cloudflare Pages project (frontend)

Run from the repo root, since the frontend build depends on `@omnomnom/shared`:

```bash
npm run build:web
npx wrangler pages project create omnomnom --production-branch main
npx wrangler pages deploy apps/web/dist --project-name omnomnom
```

Note the `*.pages.dev` URL Wrangler prints. Set the frontend's own env vars
either in a `.env.production` file before building, or as Pages environment
variables in the dashboard (Settings → Environment variables):

- `VITE_API_BASE_URL` — your Worker's URL (`https://omnomnom-api.<your-subdomain>.workers.dev`, or a custom domain)
- `VITE_ONESIGNAL_APP_ID` — same OneSignal app ID as Step 6

Then go back to Step 6 and set `ALLOWED_ORIGIN` in `apps/api/wrangler.toml` to
this Pages URL, and redeploy the Worker (Step 7) — until that matches
exactly, the API will reject the frontend's requests via CORS.

## 9. GitHub Actions deploy access (for Stage 22)

The automated deploy workflow needs a scoped API token, not your account
password:

1. Dashboard → My Profile → API Tokens → Create Token
2. Use "Edit Cloudflare Workers" as a starting template, then add permissions
   for D1, Workers KV Storage, R2, and Cloudflare Pages (all "Edit")
3. Add the token as a GitHub repository secret named `CLOUDFLARE_API_TOKEN`
4. Add your account ID (dashboard sidebar → Workers & Pages → Account ID) as
   `CLOUDFLARE_ACCOUNT_ID`

## Custom domains (optional)

Both the Worker and the Pages project can be mapped to a custom domain from
their respective dashboard pages under "Custom Domains" — free on Cloudflare's
tier as long as the domain's DNS is on Cloudflare. If you do this, update
`ALLOWED_ORIGIN` and `VITE_API_BASE_URL` to match and redeploy both sides.
