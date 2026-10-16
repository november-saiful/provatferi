# Provatferi (monorepo)

One repo, one Cloudflare Worker, two sites:

| App | Source | URL (single domain) | Stack |
|-----|--------|---------------------|-------|
| Club dashboard (home) | `apps/dashboard` | `/` | Next 14 static export + Supabase |
| Recruitment (courses + membership) | `apps/recruitment` | `/recruitment/` | Next 16 static export, invoice API in the Worker |

Merged from the `pcr` (recruitment) and `provatferi-dashboard` repos with
both git histories preserved (`git log --follow` tracks files back past the move).

## How it fits together

```
provatferi/
├── apps/dashboard/      # club home: events, gallery, calendar, finances…
├── apps/recruitment/    # course/member registration form (static UI)
├── worker/
│   ├── index.ts             # single Worker: static routing + API
│   ├── recruitment-invoice.ts  # invoice PDF generation (pdf-lib)
│   └── logo.ts              # invoice logo bytes
├── scripts/assemble.mjs # merges both apps' `out/` into dist/
├── dist/                # assembled asset tree (generated, git-ignored)
└── wrangler.jsonc       # the ONE worker config (name: provatferi)
```

The Worker serves `dist/` and handles three API routes directly:

- `GET /api/calendar.ics` — live iCalendar feed of upcoming public events
- `GET /api/health`, `GET /api/recruitment/health` — warm-up probes
- `POST /api/recruitment/submit` (legacy `/api/submit` alias kept) —
  validates the form, generates the client invoice PDF with `pdf-lib`,
  forwards the admin copy + row to the Google Apps Script backend
  (Sheet append + Drive upload). Previously a Next SSR route; now runs
  at the edge in the same Worker.

## Develop

```bash
npm run dev:dashboard     # http://localhost:3000  (dashboard)
npm run dev:recruitment   # http://localhost:3000  (recruitment, separate shell)
```

Each app keeps its own Next/React/Tailwind versions and lockfile on purpose —
unifying them is a separate upgrade project.

## Build & deploy

```bash
npm run build    # builds both apps + assembles dist/
npm run deploy   # wrangler deploy (needs CLOUDFLARE_API_TOKEN)
```

Pushes to `master` deploy via `.github/workflows/deploy.yml`.
Supabase migrations run via `.github/workflows/supabase-migrate.yml`
(paths: `apps/dashboard/supabase/migrations/**`); the Supabase keep-alive
cron is `.github/workflows/keepalive.yml`.

### Required GitHub / Wrangler secrets

| Secret | Used for |
|--------|----------|
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Worker deploy |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | dashboard build + keep-alive |
| `SUPABASE_ACCESS_TOKEN` | DB migrations |
| `APPS_SCRIPT_URL`, `GOOGLE_SHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID` | recruitment submit → Sheet/Drive (Worker secrets) |
| `SENTRY_DSN` (optional) | error monitoring — dashboard client (build env `NEXT_PUBLIC_SENTRY_DSN`) + Worker secret; unset = disabled |

Local runs need `apps/dashboard/.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`) — see `apps/dashboard/.env.example`.

## Notes & known trade-offs

- Both apps emit hashed files under `_next/`; `scripts/assemble.mjs` merges
  the trees. Same-name collisions are unlikely (different build IDs) but if a
  deploy ever serves stale JS, rebuild both apps together (`npm run build`).
- The two `logo.png` files differed, so the recruitment logo is served as
  `/recruitment-logo.png` (see `scripts/assemble.mjs`).
- Per-app `wrangler.jsonc` files and the old `open-next` SSR setup were
  removed — the root Worker + static exports are canonical.
- Old Workers (`home.*`, `recruitment.*`) can be retired once DNS points at
  this Worker.
