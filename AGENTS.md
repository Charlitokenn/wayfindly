---
description: Rules and context for AI agents building boothfinder
globs: "*"
alwaysApply: true
---

# boothfinder — Agent Configuration

## Read Before Anything Else

Read the context files in this exact order before writing any code:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/ui-tokens.md`
4. `context/ui-rules.md`
5. `context/ui-registry.md`
6. `context/code-standards.md`
7. `context/library-docs.md`
8. `context/build-plan.md`
9. `context/progress-tracker.md`

## Rules That Never Change

- Never use raw hex values or arbitrary Tailwind colour classes — always use CSS variables from `context/ui-tokens.md`
- Never write `any` in TypeScript — fix the upstream type instead
- Never use `useEffect` for data fetching — use Server Components or Server Actions
- Update `context/progress-tracker.md` and `context/ui-registry.md` after every completed feature
- Before using any third-party library, check `context/library-docs.md` for project-specific notes; if the notes are stale, use the Context7 MCP connector to fetch current docs
- If the same bug persists after one corrective prompt — stop and run `/recover`
- ClickPesa payment must always be verified server-side — never trust client-side payment state
- Leads capture (name, phone, origin, destination) and user_visits (user_id, booth_category, distance_walked) are recorded for every wayfinding session — PII stays in InsForge; PostHog events never include PII
- Milestone promotion winners are determined synchronously, server-side, at the moment a lead is created — never client-side, never async
- Contest crypto seeds are generated ONCE at contest creation and NEVER regenerated — the audit log is append-only
- Instagram access tokens are always stored encrypted in InsForge — never in env vars, never in client state
- Never expose `POSTHOG_PERSONAL_API_KEY` or `INSTAGRAM_APP_SECRET` to the client

## Available Skills / Slash Commands

- `/architect` — run before any complex feature; think, plan, then build
- `/imprint`   — run after any new UI component; capture patterns in `context/ui-registry.md`
- `/review`    — run before a demo or when something feels off
- `/recover`   — run when something breaks after one failed correction
- `/remember save`    — when a feature spans multiple sessions
- `/remember restore` — when returning after a multi-session feature

## Tech Stack Quick Reference

- **Framework**: Next.js 16 with App Router + PWA via `next-pwa` (Turbopack; middleware in `proxy.ts`)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui + diceui.com (contest draw spinner + picker)
- **Maps**: Mappedin Web SDK v6 / React SDK v6 (browser-only; `useMapData`, `<MapView>`, `<Navigation>`)
- **Backend / BaaS**: InsForge (`@insforge/sdk`; server mode needs per-request `edgeFunctionToken` from Clerk)
- **Auth**: Clerk — Google OAuth only; org-aware routing; `proxy.ts` middleware; `<Show>` components
- **Payments**: ClickPesa (Tanzania mobile money; part of onboarding flow; server-side webhook)
- **Analytics**: PostHog (zero PII; `instrumentation-client.ts` init; PostHog Insights API server-side)
- **Social**: Instagram Graph API (booth OAuth; post verification for contests)
- **Docs**: Context7 MCP connector — use to fetch latest API patterns before implementing any library feature
- **Deployment**: Cloudflare Pages

## Backend Project Details

- **InsForge project**: boothfinder
- **API base URL**: stored in `NEXT_PUBLIC_INSFORGE_URL` env variable
- **Anon key**: stored in `NEXT_PUBLIC_INSFORGE_ANON_KEY` env variable
- **Clerk→InsForge bridge**: JWT Template named `insforge` in Clerk Dashboard;
  server-side calls use `getToken({ template: 'insforge' })` → pass as `edgeFunctionToken`
- **Credentials**: read from `.env.local` — never hardcode or commit

## Key Patterns

- Public map is visible before auth; auth is triggered by booth search or 3-minute idle timer
- After Google OAuth: check `publicMetadata.onboardingComplete`; if false → redirect to `/onboarding`
- Onboarding = profile confirm + ClickPesa payment (if `app_settings.wayfinding_fee_enabled`)
- Clerk org member (booth) → `<UserProfile>` with personal profile option; personal → attendee map; org → booth panel
- Server Components fetch data; Client Components handle interaction and map rendering only
- InsForge server-mode client constructed per-request with fresh `edgeFunctionToken`
- InsForge calls return `{ data, error }` — check `error` explicitly; don't use try/catch for InsForge control flow
- Mappedin SDK loaded with `dynamic(..., { ssr: false })` — browser-only
- Instagram access tokens stored encrypted in InsForge `instagram_connections` table
- Contest seed: `crypto.randomBytes(32).toString('hex')` generated at contest creation; winner index computed as `Number(BigInt("0x" + seed) % BigInt(poolSize))`
- User visits recorded per wayfinding session in `user_visits` table; `user_profiles.total_distance_walked_m` incremented atomically
- "Hottest" booths = InsForge leads count; "Popular" = PostHog search-selection count — never conflate
