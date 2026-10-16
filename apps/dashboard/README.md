# Provatferi Dashboard

A full-stack web application for **Provatferi** — a club hub managing events, finances (with full audit trails), course attendance, donations, sponsorships, and public presence.

Built per the build specification in `club_dashboard_ai_prompt.md` and refined with the design/ACL decisions in `provatferi_planning_document.md` (Material 3 "Neural Expressive", light theme, coffee palette).

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript, **static export** |
| Hosting | Cloudflare Workers (static assets via `wrangler.jsonc` + `worker/index.ts` ASSETS binding) |
| Backend / DB / Auth | Supabase (PostgreSQL, Auth, Storage, RLS, Realtime) |
| Notifications | In-app via DB triggers + Realtime (no email service) |
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
  functions/user-admin/       # Edge function: ban/unban/delete users
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

### 4. Cloudflare Workers deploy

1. The repo ships `wrangler.jsonc` and `worker/index.ts` (SPA fallback). `npm run build` emits the static export to `./out`, which the Worker serves through an `ASSETS` binding.
2. Build with the env vars baked in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_PHONE`
3. Deploy: `npx wrangler deploy` (needs `CF_API_TOKEN`), or push to GitHub and let `.github/workflows/deploy.yml` build + deploy.
4. `next.config.mjs` already uses `output: 'export'` and `images.unoptimized`.

### 5. Keep-alive

Add repository secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY` for `.github/workflows/keepalive.yml` (runs every 5 days).

## Roles & access

15 roles (`root`, `pr` … `alm`) + `visitor`. See `lib/permissions.ts` for the UI ACL (mirrors the planning-document matrix) and the SQL migrations for the authoritative Row Level Security policies.

### Root role

The `root` role is the supreme administrator — it can only be assigned via Supabase SQL / service role, **not** through the app UI. Key properties:

- Has access to **everything** (all modules, read + write)
- Can assign the `admin` role (alongside the President)
- Can delete **any** user, including `admin` and `pr` (President)
- **Cannot** be deleted, banned, or have its role changed from the UI
- **Cannot** be assigned via the admin panel — only via Supabase SQL:
  ```sql
  UPDATE profiles SET role_id = 'root' WHERE id = '<user-uuid>';
  ```

Highlights:

| Capability | Roles |
|---|---|
| Everything / supreme admin (the app's admin roles) | `root`, `pr`, `vp`, `admin` |
| Assign the `admin` role | `pr`, `root` (single-admin safeguard) |
| Delete any user (including president) | `root` only |
| Edit expenses (audited) | `root`, `pr`, `vp`, `admin`, `rds` |
| Add expenses | + `tr`, `ofs`, `ors` |
| View expenses | + `gs` (not `jgs`) |
| Budgets (view/edit) | `root`, `pr`, `vp`, `admin`, `cs`, `acs`, `rds` |
| Attendance management | `root`, `pr`, `vp`, `admin`, `gs`, `jgs`, `cc` |
| Pin notices | `root`, `pr`, `vp`, `admin` |
| Upload gallery | `root`, `pr`, `vp`, `admin`, `gs`, `jgs`, `pps`, `prs`, `ofs`, `ors` |
| View audit log | all signed-in except `alm` |
| Donation amounts | any signed-in user |

## Audit trail & notifications

- `log_record_change()` (migration `00007`) fires on `UPDATE`/`DELETE` of `expenses` and `budgets`, writing before/after snapshots to `records_log`.
- The dashboard **Records** module (`/dashboard/rcd`) shows the unified log with a side-by-side diff view.
- **In-app notifications** (migration `00017`) replace the old Resend email flow: DB triggers write to `notifications` when a record is edited/deleted (to its original creator), a sponsor inquiry arrives (`pr`/`vp`/`gs`/`tr`), a donation is received (`tr`/`pr`/`vp`), a role is changed (to the affected user), or someone comments on your event. The bell in the app bar shows an unread badge and a dropdown panel (mark-as-read / mark-all-read / clear all) that updates live over Realtime.
- The old `send-notification` edge function, the `records_log_notify` trigger and the `records_log.notified` column were removed (migration `00016`). If you had deployed them, delete the edge function and the database webhook from the Supabase dashboard.

## Design notes & deliberate deviations

- **Donation amounts:** RLS is row-level only, so a single table cannot hide the `amount` column from the public. We expose names/messages through a SECURITY DEFINER `get_donor_board()` RPC and keep full rows (with amounts) behind the signed-in `donations` select policy. This is a safe, spec-compliant interpretation of the "public wall, members see amounts" requirement.
- **Detail pages** (`event item`, `notice item`) use query strings (`?id=…`) instead of dynamic path segments so the static export (`output: 'export'`) works without `generateStaticParams`.
- **Role assignment** (admin panel) updates `profiles.role_id` and auto-assigns a `display_id` following the `{role}-NN` convention (e.g. `tr-01`); it cannot change your own role. Role changes are not yet written to `records_log` (the enum covers operational tables) — documented as a future enhancement.
- **Comments** are stored plain text; notices support a basic markdown toolbar (bold, italic, headings, lists, code, links) rendered safely by `renderMarkdown` in `lib/utils.ts`.
- **Attendance** management is available to `pr`, `vp`, `gs`, `jgs`, and `cc`. The public course cards read all attendance rows and filter per schedule, so every course shows its own completion; recording attendance invalidates the shared `['attendance']` cache so the insights charts refresh immediately.
- **Realtime** (migrations `00009` + `00017`): events, comments, gallery, calendar, notices, donations, sponsors and notifications are added to the `supabase_realtime` publication; the client's `useRealtimeInvalidate` hook refreshes those lists on change, and the notification bell updates without a page refresh.

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
