# boothfinder — Build Plan

> Authoritative feature roadmap. Do not edit mid-session.
> See `context/progress-tracker.md` for current status.

---

## Phase 1 — Foundation

*Goal: working shell with auth, onboarding, DB schema, and empty route groups.*

| # | Feature | Description |
|---|---------|-------------|
| 1 | Project setup | Next.js 16 + PWA (`next-pwa`) + Clerk (Google OAuth only) + InsForge + Tailwind v4 + shadcn/ui. Create full DB schema (venues, events, booths, leads, payments, user_profiles, user_visits, instagram_connections, contests, contest_entries, contest_audit_logs, promotions, promotion_entries, app_settings). Set up route groups: `(public)`, `(onboarding)`, `(attendee)`, `(admin)`, `(booth)`. Configure `clerkMiddleware()` in `proxy.ts`. |
| 2 | Google OAuth + Clerk routing | Clerk configured for Google OAuth only. `proxy.ts` enforces: unauthenticated → `(public)` only; incomplete onboarding → redirect `/onboarding`; org member → org-aware routing. `<UserProfile>` with personal profile enabled for org members. |
| 3 | Idle sign-in prompt | `useIdleSignInPrompt` hook (3-min inactivity timer). On desktop: centered Dialog. On mobile: bottom Sheet. Timer resets on any user interaction. Does not fire if already signed in. |
| 4 | Onboarding flow | `/onboarding` page with three steps: (1) confirm name + phone, (2) ClickPesa payment if `app_settings.wayfinding_fee_enabled`, (3) success screen. On completion: Clerk `publicMetadata.onboardingComplete = true` via Backend API. Subsequent logins: incomplete users auto-redirected to `/onboarding`. |
| 5 | Admin panel + app settings | Admin CRUD for venues, events (with date ranges + status), booth assignments. Admin settings page: wayfinding fee on/off toggle + amount (TZS) → written to InsForge `app_settings`. Protected by `publicMetadata.role === 'admin'`. |

---

## Phase 2 — Venue Map & Navigation

*Goal: Mappedin interactive map is live with full wayfinding and user profiling.*

| # | Feature | Description |
|---|---------|-------------|
| 6 | Venue map browsing UI | Attendee landing: upcoming and active events as cards. Search + filter booths by name and category (triggers Google sign-in if unauthenticated). Booth detail bottom sheet. Dynamic event display: upcoming → active on start_date; conflict picker if multiple active. |
| 7 | Mappedin SDK integration | `useMapData` + `<MapView>` for active event's `mappedin_map_id`. Booth pins via `mappedin_space_id`. Offline badge when map is in offline state. `dynamic(..., { ssr: false })`. |
| 8 | Blue-dot wayfinding + user profiling | Blue-dot via `mapView.BlueDot.enable()`. "Navigate" triggers `departure.directionsTo(destination)` + `<Navigation>`. Distance from `directions.distance` (metres). On navigation start: record `user_visits` row (user_id, booth_id, booth_category, distance_walked_m, event_id) and increment `user_profiles.total_distance_walked_m`. |
| 9 | Leads capture | Name + phone form before route is drawn. Stored in `leads` with `origin_space_id`, `origin_label`, `booth_id`, `navigated_at`. PostHog: `wayfinding_started`, `wayfinding_completed`. |

---

## Phase 3 — Payments

*Goal: ClickPesa payment gate inside onboarding; admin fee configuration.*

| # | Feature | Description |
|---|---------|-------------|
| 10 | ClickPesa onboarding payment | Server Action reads `app_settings` fee config. If enabled: initiates ClickPesa charge. Webhook → `/api/payments/webhook` → verify signature → write `payments` record (`payment_type: 'onboarding'`) → call Clerk Backend API to set `publicMetadata.onboardingComplete = true`. Client polls every 2s. 5-min timeout → `expired` state + retry. |
| 11 | Payment status tracking | Three UI states in onboarding step 2: "Awaiting payment", "Processing", "Confirmed". Admin can view all onboarding payments (InsForge query). |

---

## Phase 4 — Booth Management

*Goal: Booth owners manage their org profile, leads, and analytics.*

| # | Feature | Description |
|---|---------|-------------|
| 12 | Booth panel + Organization Profile | Booth owners (Clerk org members) routed via `<UserProfile>` org selector to `/booth` dashboard. Booth identity (name, logo) managed via Clerk's native `<OrganizationProfile>` "General" page. A custom "Booth Details" page added to the same component (Clerk custom pages API) handles category, description, and Mappedin space assignment — written to InsForge `booths`. `organization.updated` webhook keeps `booths.business_name`/`logo_url` synced. Preview booth card. |
| 13 | Leads list + CSV download | Paginated table: name, phone, origin, destination, date. `/api/leads/export` streams CSV. Visitor count badge on public booth detail (InsForge `leads` count). |
| 14 | User profiling analytics (paid) | Booth panel: per-user visit history aggregated by booth_category from `user_visits`. Total distance walked shown on attendee profile page. Admin + booth analytics: hottest booths (InsForge counts) + most popular booths (PostHog `booth_search_result_selected`). |

---

## Phase 5 — PostHog Analytics

*Goal: Anonymous behavioural tracking across the full funnel.*

| # | Feature | Description |
|---|---------|-------------|
| 15 | PostHog integration | `instrumentation-client.ts` init. All standard events instrumented (see `library-docs.md`). Zero PII in any event. |
| 16 | Booth analytics dashboard | Booth panel: visitor count (InsForge), search popularity (PostHog Insights API), category preference heatmap from `user_visits`. Admin: venue-wide hottest + most-searched leaderboards. |

---

## Phase 6 — Promotions

*Goal: Milestone visitor gifts and the social share-to-win draw system.*

| # | Feature | Description |
|---|---------|-------------|
| 17 | Milestone visitor promotions | Booth panel: create milestone promotion (target Nth visitor, scope day/week/event, prize, optional "require QR scan" toggle). If QR required: a unique `qr_code_token` is generated and displayed for printing at the physical booth; scanning it via `/scan/[token]` flags the attendee's most recent lead as `qr_scanned`. Server-side check on every qualifying lead (QR-scanned if required, otherwise every lead): if milestone hit → flag winner in `promotion_entries` → client shows congrats popup (non-dismissible Dialog) instructing them to claim their gift. |
| 18 | Social share-to-win draw (manual) | Booth panel: create promotion (`type: social_share_draw`). After wayfinding completion: bottom sheet prompts attendee to share + submit URL. Booth owner manually selects winner from `promotion_entries` table. No Instagram verification at this stage (used only in Phase 7 contests). |

---

## Phase 7 — Instagram Contests

*Goal: Full Instagram-verified contest system with cryptographic winner draw.*

| # | Feature | Description |
|---|---------|-------------|
| 19 | Instagram OAuth (booth) | Booth panel `/instagram`: "Connect Instagram" OAuth flow. Server Action → OAuth URL → `/api/auth/instagram/callback` → exchange code for long-lived token → encrypt → store in InsForge `instagram_connections`. Show connected IG username. Disconnect with AlertDialog confirmation. |
| 20 | Contest setup (booth panel) | Create contest: title, prize, campaign hashtag, required IG tag, start/end dates, max_entries_per_user, engagement_weights (per-action toggles + weights), scope. On create: `crypto.randomBytes(32)` seed generated + stored + displayed immediately to booth owner. Status: `draft` → `active` on start_date. |
| 21 | Contest entry submission (attendee) | Booth event page shows contest details (prize, hashtag, tag, dates, and the crypto seed displayed publicly) plus an "Enter Contest" section while `isContestOpen === true`. Attendee submits Instagram post URL. Submission UI hidden entirely after `end_date` (seed + details remain visible for verification). Server Action: check max_entries_per_user, call `/api/contests/[contestId]/verify`, compute entry_weight, store `contest_entries`. PostHog: `contest_entry_submitted`. |
| 22 | Instagram post verification | `/api/contests/[contestId]/verify` — use booth's stored access token to call Instagram Graph API. Check each configured engagement action. Compute entry_weight. Cache result in `ig_verified` + `ig_verified_at`. Rate-limit guard: skip re-verification of already-verified entries. Use Context7 to fetch current Graph API endpoint docs before implementing. |
| 23 | Contest entries panel (booth) | Booth panel: paginated entries table (name, date, IG link, verified ✓/✗, weight, entry count, status). Confirmed entries only shown in draw pool. |
| 24 | Winner draw (booth panel) | `WinnerDrawModal`: shows seed, total entry pool size, diceui Spinner animation, then winner (name, phone, Clerk profile photo). Server Action: build entry pool, `pickWinnerIndex(seed, poolSize)`, flag winner, write `contest_audit_logs`. Winner stored in `contests.winner_entry_id`. Audit log shown in collapsible monospace block. |

---

## Phase 8 — Event Management

*Goal: Dynamic event display driven by real dates.*

| # | Feature | Description |
|---|---------|-------------|
| 25 | Event CRUD with date ranges | Admin sets start_date + end_date. Status computed server-side: `draft` → `upcoming` → `active` → `ended`. |
| 26 | Dynamic map display | Upcoming events listed by default. Active event map auto-loads on start_date. Ended events archived. |
| 27 | Concurrent event conflict picker | Two+ active events on same day → selection modal. Choice stored in session. |

---

## Phase 9 — Production Readiness

*Goal: Offline-capable PWA hardened and deployed to Cloudflare.*

| # | Feature | Description |
|---|---------|-------------|
| 28 | PWA offline + Mappedin offline | SW caches app shell. Mappedin caches tiles after first load. "You are offline" banner. Payment + Instagram submission disabled gracefully when offline. PostHog events queue and flush on reconnect. |
| 29 | Instagram token refresh | Cloudflare Scheduled Worker: check `instagram_connections.token_expires_at`; refresh tokens expiring within 30 days via Instagram token refresh endpoint. |
| 30 | Cloudflare Pages deployment | `@cloudflare/next-on-pages` adapter. All env vars in Cloudflare dashboard. Custom domain. CI: `npm run lint && npm run build` must pass before deploy. |
