# Provatferi Dashboard

A full-stack web application for **Provatferi** — a club hub managing events, finances (with full audit trails), course attendance, donations, sponsorships, and public presence.

Built per the build specification in `club_dashboard_ai_prompt.md` and refined with the design/ACL decisions in `provatferi_planning_document.md` (Material 3 "Neural Expressive", light theme, coffee palette).

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript, **static export** |
| Hosting | Cloudflare Workers (static assets via `wrangler.jsonc` + `worker/index.ts` ASSETS binding) |
| Backend / DB / Auth | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Email | Resend via a Supabase Edge Function |
| Styling | Tailwind CSS + custom shadcn-style components |
| Charts | Recharts |
| Calendar | react-big-calendar |
| Data / state | TanStack Query + Zustand |
| Forms | React Hook Form + Zod |
| Keep-alive | GitHub Actions cron |

## Repository layout

```
app/                  # Next.js App Router pages (public + /dashboard/*)
components/
  auth/               # Auth provider, RoleGuard
  forms/              # All module forms
  layout/             # Dashboard shell + public nav/footer
  modules/            # Feature components (events, gallery, calendar, …)
  ui/                 # UI primitives
lib/
  supabase/client.ts  # Supabase browser client
  queries.ts          # React Query hooks
  permissions.ts      # Role → module ACL (UI visibility)
  types.ts            # Row types matching the schema
scripts/seed-users.mjs # Creates test users (2 per role) via service-role key
supabase/
  migrations/         # SQL schema + RLS + triggers + seed (run in order)
  functions/send-notification/  # Email edge function
.github/workflows/keepalive.yml # Prevents Supabase free-tier pause
worker/                        # Cloudflare Worker: serves ./out with SPA fallback
wrangler.jsonc                 # Worker config (ASSETS binding → ./out)
```

## Getting started

### 1. Environment

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

```bash
npm install
npm run dev        # http://localhost:3000
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run every file in `supabase/migrations/` **in order** (00001 → 00012). This creates the tables, RLS policies, triggers, storage bucket, seed data, and enables Realtime for the public tables. Migration 00012 is required for the expanded attendance roles.
3. Storage: the `gallery` bucket is created by migration `00007`. Verify it exists under **Storage**, is **public**, and has the RLS policies applied.
4. Auth settings → add redirect URLs for your Cloudflare Workers domain and `http://localhost:3000`.

### 3. Seed test users

```bash
cp .env.local .env   # seed script reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
```

Add your **service role key** to `.env`/`.env.local` (never put it in client code):

```
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

```bash
npm run seed:users
```

Creates 2 accounts per role (password `Provatferi@2026`), e.g. `pr1@provatferi.test`, `pr2@provatferi.test`, `tr1@provatferi.test`, `cc1@provatferi.test`, plus visitors. Profiles are auto-created by the `on_auth_user_created` trigger; the script then assigns roles and `display_id`.

### 4. Email notifications (optional but required for audit emails)

1. Create a Resend account and verify a sending domain.
2. In Supabase Dashboard → **Edge Functions**, deploy `supabase/functions/send-notification`:
   - `npx supabase functions deploy send-notification --project-ref YOUR_REF`
   - Or paste the code into the dashboard editor.
3. Set function secrets:
   - `RESEND_API_KEY`
   - `SITE_URL` (e.g. `https://home.provatferi2009.workers.dev`)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` are auto-injected when deployed via CLI.
4. Database → **Webhooks** → create a webhook on `records_log` → event `INSERT` → POST to your edge function URL with **POST** body of the row.

> The `notify_on_record_change()` trigger emits `pg_notify` on every `records_log` insert as a fallback / for future realtime use. The webhook is the primary email path.

### 5. Cloudflare Workers deploy

1. The repo ships `wrangler.jsonc` and `worker/index.ts` (SPA fallback). `npm run build` emits the static export to `./out`, which the Worker serves through an `ASSETS` binding.
2. Build with the env vars baked in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_PHONE`
3. Deploy: `npx wrangler deploy` (needs `CF_API_TOKEN`), or push to GitHub and let `.github/workflows/deploy.yml` build + deploy.
4. `next.config.mjs` already uses `output: 'export'` and `images.unoptimized`.

### 6. Keep-alive

Add repository secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY` for `.github/workflows/keepalive.yml` (runs every 5 days).

## Roles & access

14 roles (`pr` … `alm`) + `visitor`. See `lib/permissions.ts` for the UI ACL (mirrors the planning-document matrix) and the SQL migrations for the authoritative Row Level Security policies.

Highlights:

| Capability | Roles |
|---|---|
| Everything / super-admin (the app's admin roles) | `pr`, `vp` |
| Edit expenses (audited) | `pr`, `vp`, `rds` |
| Add expenses | + `tr`, `ofs`, `ors` |
| View expenses | + `gs` (not `jgs`) |
| Budgets (view/edit) | `pr`, `vp`, `cs`, `acs`, `rds` |
| Attendance management | `pr`, `vp`, `gs`, `jgs`, `cc` |
| Pin notices | `pr`, `vp` |
| Upload gallery | `pr`, `vp`, `gs`, `jgs`, `pps`, `prs`, `ofs`, `ors` |
| View audit log | all signed-in except `alm` |
| Donation amounts | any signed-in user |

## Audit trail & notifications

- `log_record_change()` (migration `00007`) fires on `UPDATE`/`DELETE` of `expenses` and `budgets`, writing before/after snapshots to `records_log`.
- The dashboard **Records** module (`/dashboard/rcd`) shows the unified log with a side-by-side diff view.
- When a record is changed, the edge function emails the original creator.

## Design notes & deliberate deviations

- **Donation amounts:** RLS is row-level only, so a single table cannot hide the `amount` column from the public. We expose names/messages through a public `donor_board` view and keep full rows (with amounts) behind the signed-in `donations` select policy. This is a safe, spec-compliant interpretation of the "public wall, members see amounts" requirement.
- **Detail pages** (`event item`, `notice item`) use query strings (`?id=…`) instead of dynamic path segments so the static export (`output: 'export'`) works without `generateStaticParams`.
- **Role assignment** (admin panel) updates `profiles.role_id` and auto-assigns a `display_id` following the `{role}-NN` convention (e.g. `tr-01`); it cannot change your own role. Role changes are not yet written to `records_log` (the enum covers operational tables) — documented as a future enhancement.
- **Comments** are stored plain text; notices support a basic markdown toolbar (bold, italic, headings, lists, code, links) rendered safely by `renderMarkdown` in `lib/utils.ts`.
- **Attendance** management is available to `pr`, `vp`, `gs`, `jgs`, and `cc`. The public course cards read all attendance rows and filter per schedule, so every course shows its own completion; recording attendance invalidates the shared `['attendance']` cache so the insights charts refresh immediately.
- **Realtime** (migration `00009`): events, comments, gallery, calendar, notices, donations and sponsors are added to the `supabase_realtime` publication; the client's `useRealtimeInvalidate` hook refreshes those lists on change.

## Commands

```bash
npm run dev          # local dev
npm run build        # static export to /out
npm run lint         # eslint
npm run seed:users   # create test users (needs service-role key)
```

## Security checklist

- Service-role key lives only in Supabase secrets / the seed script. **Never** in the frontend.
- RLS is enabled on every table; policies are in migrations 00001–00006.
- Uploads go through Supabase Storage with bucket policies (resized to ≤1920px client-side).
- Public forms (donation, sponsor) are rate-limit candidates for a future edge function.
