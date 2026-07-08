# boothfinder — Progress Tracker

Last updated: 2026-07-08

---

## Phase 1 — Foundation
| Status | # | Feature | Notes |
|--------|---|---------|-------|
| [x] | 1 | Project setup + full DB schema | Created 15 tables in InsForge |
| [x] | 2 | Google OAuth + Clerk org routing | |
| [x] | 3 | Idle sign-in prompt (3-min timer) | |
| [x] | 4 | Onboarding flow | |
| [x] | 5 | Admin panel + app settings (fee toggle) | |

## Phase 2 — Venue Map & Navigation

| Status | # | Feature | Notes |
|--------|---|---------|-------|
| [x] | 6  | Venue map browsing UI | |
| [x] | 7  | Mappedin SDK integration | |
| [x] | 8  | Blue-dot wayfinding + user profiling | |
| [x] | 9  | Leads capture (name, phone, origin, destination) | |

## Phase 3 — Payments

| Status | # | Feature | Notes |
|--------|---|---------|-------|
| [x] | 10 | ClickPesa onboarding payment | |
| [x] | 11 | Payment status tracking | |

## Phase 4 — Booth Management

| Status | # | Feature | Notes |
|--------|---|---------|-------|
| [ ] | 12 | Booth panel + Organization Profile (Clerk custom page) | |
| [ ] | 13 | Leads list + CSV download + visitor badge | |
| [ ] | 14 | User profiling analytics (paid feature) | |

## Phase 5 — PostHog Analytics

| Status | # | Feature | Notes |
|--------|---|---------|-------|
| [ ] | 15 | PostHog integration | |
| [ ] | 16 | Booth analytics dashboard | |

## Phase 6 — Promotions

| Status | # | Feature | Notes |
|--------|---|---------|-------|
| [ ] | 17 | Milestone visitor promotions | |
| [ ] | 18 | Social share-to-win draw (manual) | |

## Phase 7 — Instagram Contests

| Status | # | Feature | Notes |
|--------|---|---------|-------|
| [ ] | 19 | Instagram OAuth (booth) | |
| [ ] | 20 | Contest setup (booth panel) | |
| [ ] | 21 | Contest entry submission (attendee) | |
| [ ] | 22 | Instagram post verification | |
| [ ] | 23 | Contest entries panel (booth) | |
| [ ] | 24 | Winner draw (diceui Spinner + audit log) | |

## Phase 8 — Event Management

| Status | # | Feature | Notes |
|--------|---|---------|-------|
| [ ] | 25 | Event CRUD with date ranges | |
| [ ] | 26 | Dynamic map display | |
| [ ] | 27 | Concurrent event conflict picker | |

## Phase 9 — Production Readiness

| Status | # | Feature | Notes |
|--------|---|---------|-------|
| [ ] | 28 | PWA offline + Mappedin offline maps | |
| [ ] | 29 | Instagram token refresh (Cloudflare Scheduled Worker) | |
| [ ] | 30 | Cloudflare Pages deployment | |

---

## Legend

- `[ ]` Not started
- `[~]` In progress (current session)
- `[x]` Complete
- `[!]` Blocked — see notes

---

## Current Session Focus

> Feature being worked on right now: **Phase 2 — Blue-dot wayfinding + user profiling**

## Known Blockers

> None currently.

## Build Notes

**Feature 1 — Project setup + full DB schema** (2026-07-08)
Files changed: `package.json`, `app/layout.tsx`, `app/globals.css`, `proxy.ts`, `lib/insforge/schema.txt`, `lib/insforge/schema.sql`
Decisions: Used Ubuntu font for sans, JetBrains Mono for mono. Configured Tailwind v4 with project tokens. Defined 15 tables for InsForge and imported them using InsForge CLI.
Next: Feature 2 — Google OAuth + Clerk org routing

**Feature 2 — Google OAuth + Clerk org routing** (2026-07-08)
Files changed: `proxy.ts`, `components/auth/Show.tsx`, `app/page.tsx`
Decisions: Implemented `afterAuth` middleware for onboarding and org redirects. Created `<Show>` component for role-based UI.
Next: Feature 3 — Idle sign-in prompt (3-min timer)

**Feature 3 — Idle sign-in prompt (3-min timer)** (2026-07-08)
Files changed: `lib/hooks/useIdleTimer.ts`, `components/auth/IdleSignInPrompt.tsx`, `app/layout.tsx`
Decisions: Used Framer Motion for the prompt modal. Hook listens to mouse, key, and touch events.
Next: Feature 4 — Onboarding flow

**Feature 4 — Onboarding flow** (2026-07-08)
Files changed: `app/(onboarding)/onboarding/page.tsx`, `app/(onboarding)/onboarding/actions.ts`, `lib/insforge/client.ts`
Decisions: Syncing user profile to InsForge and updating Clerk metadata. Using Server Actions for form submission.
Next: Feature 5 — Admin panel + app settings (fee toggle)

**Feature 5 — Admin panel + app settings (fee toggle)** (2026-07-08)
Files changed: `app/(admin)/settings/page.tsx`, `app/(admin)/settings/actions.ts`
Decisions: Restricted access via `publicMetadata.role === 'admin'`. Single record with ID 'global' in `app_settings` table.
Next: Phase 2 — Venue Map & Navigation

**Build Stabilization** (2026-07-08)
Files changed: `lib/insforge/client.ts`, `app/(onboarding)/onboarding/actions.ts`, `app/(admin)/settings/actions.ts`, `app/(admin)/settings/page.tsx`
Decisions: Corrected InsForge SDK usage to match version 6 signatures. Moved database calls to `.database.from()` and fixed client config properties (`baseUrl`, `accessToken`).
Next: Phase 2 — Feature 6 (Venue map browsing UI)

**Feature 6 — Venue map browsing UI** (2026-07-08)
Files changed: `app/(public)/events/page.tsx`, `components/events/EventCard.tsx`
Decisions: Created a landing page to browse active and upcoming events. Status is determined dynamically server-side.
Next: Feature 7 — Mappedin SDK integration

**Feature 7 — Mappedin SDK integration** (2026-07-08)
Files changed: `components/map/MapView.tsx`, `app/(attendee)/events/[eventId]/page.tsx`, `next.config.ts`
Decisions: Integrated Mappedin React SDK v6. Use `dynamic` with `ssr: false` for the Map component. Added `transpilePackages` for SDK.
Next: Feature 8 — Blue-dot wayfinding + user profiling

**Feature 8 & 9 — Wayfinding, Profiling & Leads** (2026-07-08)
Files changed: `app/(attendee)/events/actions.ts`, `components/map/MapView.tsx`, `app/(attendee)/events/[eventId]/page.tsx`
Decisions: Implemented Server Action to record visits, leads, and distance walked. Enabled Mappedin Blue-Dot and Navigation.
Next: Phase 3 — Feature 10 (ClickPesa onboarding payment)

**Feature 10 & 11 — ClickPesa Payments** (2026-07-08)
Files changed: `lib/clickpesa.ts`, `app/(onboarding)/onboarding/actions.ts`, `app/(onboarding)/onboarding/payment/page.tsx`, `app/api/payments/webhook/route.ts`
Decisions: Integrated ClickPesa mobile money (TZS). Implemented polling + webhook for status synchronization. Ensured server-side verification before completing onboarding.
Next: Phase 4 — Feature 12 (Booth panel + Organization Profile)
