# Provatferi (monorepo)

One repo, one Cloudflare Worker, one site:

| Route | Source | Stack |
|-------|--------|-------|
| `/` — club home | `apps/dashboard` | Next 14 static export + Supabase |
| `/recruitment/` — courses + membership | `apps/dashboard/app/recruitment` | same app shell, invoice API in the Worker |

Recruitment was originally a separate Next app (`pcr`). It now lives inside the
dashboard app so it shares the header, footer, navigation and design tokens;
only the invoice API remains in the Worker.

## How it fits together

```
provatferi/
├── apps/dashboard/      # the whole site: home, events, recruitment, admin…
├── worker/
│   ├── index.ts             # single Worker: static routing + API
│   ├── recruitment-invoice.ts  # invoice PDF generation (pdf-lib)
│   └── logo.ts              # invoice logo bytes
├── integrations/
│   └── apps-script.gs       # Google Apps Script backend (Sheet + Drive) source
├── scripts/assemble.mjs # copies apps/dashboard/out → dist/
├── dist/                # assembled asset tree (generated, git-ignored)
└── wrangler.jsonc       # the ONE worker config (name: provatferi)
```

The Worker serves `dist/` and handles these API routes directly:

- `GET /api/calendar.ics` — live iCalendar feed of upcoming public events
- `GET /api/health`, `GET /api/recruitment/health` — warm-up probes
- `POST /api/recruitment/submit` (legacy `/api/submit` alias kept) —
  validates the form, generates the client invoice PDF with `pdf-lib`,
  forwards the admin copy + row to the Google Apps Script backend
  (Sheet append + Drive upload). Also rejects submissions while the
  recruitment phase is closed.

### Recruitment phase control

`app_config` keys (migration `00044_recruitment_settings.sql`):

| Key | Meaning |
|-----|---------|
| `recruitment_enabled` | `'true'` / `'false'` — master switch |
| `recruitment_starts_at` | ISO-8601 UTC, empty = no lower bound |
| `recruitment_ends_at` | ISO-8601 UTC, empty = no upper bound |

President, vice-president, admin and root edit these at
**Dashboard → অ্যাডমিন → রিক্রুটমেন্ট**. The page, the popup and the home/nav
links respect the phase, and the popup shows a live countdown to the start or
end time.

## Develop

```bash
npm run dev:dashboard     # http://localhost:3000 (includes /recruitment/)
```

## Build & deploy

```bash
npm run build    # builds the dashboard + assembles dist/
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

- The `apps/dashboard` static export owns every route, including
  `/recruitment/`; there is only one `_next/` tree to deploy.
- The Worker's static fallback still serves `/recruitment/index.html` for
  `/recruitment/*`, so old bookmarks keep working.
- Per-app `wrangler.jsonc` files and the old `open-next` SSR setup were
  removed — the root Worker + static export is canonical.
- Old Workers (`home.*`, `recruitment.*`) can be retired once DNS points at
  this Worker.
