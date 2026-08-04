# Committee Members — Reference

## The rule (single source of truth)

**A committee member is any club user whose role is NOT `visitor` (Visitor) or
`alm` (Alumni).** In other words: everyone except visitors and alumni.

The public contact page lists these members. Anywhere the app needs to answer
"is this person on the committee?" it must use this definition.

## Committee roles

| id | Bengali name |
|---|---|
| `pr` | সভাপতি |
| `vp` | সহ-সভাপতি |
| `admin` | অ্যাডমিন |
| `gs` | সাধারণ সম্পাদক |
| `jgs` | যুগ্ম সাধারণ সম্পাদক |
| `tr` | কোষাধ্যক্ষ |
| `ofs` | অফিস সম্পাদক |
| `ors` | সাংগঠনিক সম্পাদক |
| `cs` | সাংস্কৃতিক সম্পাদক |
| `acs` | সহকারী সাংস্কৃতিক সম্পাদক |
| `pps` | প্রচার ও প্রকাশনা সম্পাদক |
| `prs` | জনসংযোগ সম্পাদক |
| `rds` | রেকর্ড ও ডকুমেন্টেশন সম্পাদক |
| `cc` | কোর্স কো-অর্ডিনেটর |

**Not on the committee:**

- `visitor` — Visitor / public (self-registered users)
- `alm` — Alumni (former members)

## Where it lives in code

- `lib/permissions.ts` → `COMMITTEE_ROLES` + `isCommitteeMember(role)` — the
  authoritative definition, derived from `ROLE_ORDER` minus `alm`/`visitor`.
  Used by UI gating (dashboard home stats, balance widget, storage indicator).
- `lib/queries.ts` → `useCommitteeMembers()` — fetches `profiles` whose
  `role_id` is in `COMMITTEE_ROLES` and `is_active = true`, joined with the
  `roles` table for the Bengali role name.
- `app/contact/page.tsx` — renders the committee roster from that query.

> Note: the legacy `committee_contacts` table (migration 00006) is no longer
> the source of truth for the contact page. Membership is derived directly from
> `profiles.role_id`, so the roster always stays in sync with the real roles.
