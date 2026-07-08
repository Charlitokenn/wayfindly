# boothfinder — Architecture

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | PWA via `next-pwa`; Turbopack default bundler; deployed to Cloudflare Pages |
| Language | TypeScript 5 | Strict mode; no `any` |
| Styling | Tailwind CSS v4 + shadcn/ui + diceui.com | CSS-first config; diceui used for contest picker spinner and draw components |
| Maps | Mappedin Web SDK v6 / React SDK v6 | Browser-only; `useMapData` + `<MapView>` + `<Navigation>`; offline tiles auto-cached |
| Backend / BaaS | InsForge | PostgreSQL DB, Clerk JWT bridge, file storage, edge functions |
| Auth | Clerk | Google OAuth only; org-aware routing; `proxy.ts` middleware |
| Payments | ClickPesa | Tanzania mobile money; server-side webhook verification; part of onboarding |
| Analytics | PostHog | Search popularity + product analytics; zero PII in events |
| Instagram | Instagram Graph API (Meta) | OAuth for booth connections; post verification for contests |
| Deployment | Cloudflare Pages | Edge runtime; `@cloudflare/next-on-pages` adapter |
| Docs lookup | Context7 MCP | Use via Context7 connector to fetch latest API patterns for all libraries |

## Folder Structure

```
boothfinder/
├── app/
│   ├── (public)/                # Unauthenticated landing + map browse
│   │   └── page.tsx             # Event list / active event floor plan
│   ├── (onboarding)/            # Post-login gate; payment lives here
│   │   └── onboarding/page.tsx  # Step-by-step: profile confirm → pay fee → done
│   ├── (attendee)/              # Auth + onboarding-complete required
│   │   ├── events/[eventId]/    # Event floor plan + booth discovery
│   │   └── navigate/[boothId]/  # Wayfinding screen
│   ├── (admin)/                 # Clerk publicMetadata.role === 'admin'
│   │   ├── venues/
│   │   ├── events/
│   │   ├── booths/
│   │   └── settings/            # Wayfinding fee toggle + amount
│   ├── (booth)/                 # Clerk org member (business role)
│   │   ├── page.tsx             # Booth panel dashboard (leads overview) — default landing
│   │   ├── organization-profile/ # Clerk <OrganizationProfile> mount point —
│   │   │                        #   native org settings (name, logo) PLUS a
│   │   │                        #   custom "Booth Details" page (category,
│   │   │                        #   description, mappedin_space_id) via Clerk's
│   │   │                        #   custom pages API — see library-docs.md
│   │   ├── leads/
│   │   ├── analytics/
│   │   ├── promotions/
│   │   ├── contests/            # Contest CRUD + entry review + winner draw
│   │   └── instagram/           # Instagram OAuth connect + disconnect
│   └── api/
│       ├── payments/webhook/    # ClickPesa payment confirmation
│       ├── leads/export/        # CSV stream
│       ├── auth/instagram/
│       │   └── callback/        # Instagram OAuth redirect handler
│       ├── contests/
│       │   └── [contestId]/verify/ # Instagram post verification job
│       └── promotions/check/    # Milestone winner check on lead insert
├── components/
│   ├── ui/                      # shadcn/ui primitives (do not edit)
│   ├── map/                     # Mappedin viewer, wayfinding, booth pins
│   ├── onboarding/              # OnboardingModal, PaymentStep, ProfileStep
│   ├── auth/                    # IdleSignInPrompt (3-min timer), GoogleSignInButton
│   ├── events/                  # EventCard, EventPicker
│   ├── booths/                  # BoothCard, BoothDetailSheet, VisitorCountBadge
│   ├── payments/                # ClickPesaModal, PaymentStatusDisplay
│   ├── leads/                   # LeadsDataTable (diceui DataTable)
│   ├── promotions/              # MilestoneSetupForm, CongratsPopup, ShareToWinSheet
│   ├── contests/                # ContestSetupForm, ContestEntriesDataTable, WinnerDrawModal (diceui)
│   ├── instagram/               # ConnectInstagramButton, PostSubmitForm
│   ├── analytics/               # HottestBoothsChart, PopularBoothsChart, UserProfileCard
│   └── shared/                  # Navbar, layout wrappers, skeletons
├── lib/
│   ├── insforge/
│   │   ├── client.ts            # createClient wrapper (server + browser modes)
│   │   └── queries/             # Typed query helpers per domain
│   ├── clerk.ts                 # auth() helpers, role checks, org routing
│   ├── clickpesa.ts             # ClickPesa API client + payment helpers
│   ├── mappedin.ts              # SDK init helpers
│   ├── posthog/
│   │   ├── client.ts            # posthog-js (via instrumentation-client.ts)
│   │   └── server.ts            # posthog-node for server captures
│   ├── instagram/
│   │   ├── oauth.ts             # OAuth flow helpers
│   │   ├── api.ts               # Instagram Graph API queries
│   │   └── verify.ts            # Post verification logic
│   ├── contests/
│   │   ├── seed.ts              # crypto.randomBytes seed generation
│   │   ├── weights.ts           # Entry weight calculation
│   │   └── draw.ts              # Weighted random draw using seed
│   ├── user-profile.ts          # Visit recording, distance tracking, preference aggregation
│   ├── utils.ts
│   └── validations.ts
├── types/
│   └── index.ts
├── instrumentation-client.ts    # PostHog init
├── context/                     # AI agent context files
├── public/manifest.json
├── proxy.ts                     # clerkMiddleware() — Next.js 16
├── .env.local
└── next.config.ts
```

## Auth & Onboarding Flow

```
User opens PWA (public map view visible immediately, no auth required)
  │
  ├─ User searches for a booth → trigger Clerk Google OAuth sign-in modal
  │
  └─ User idles 3 minutes without signing in → show sign-in/sign-up modal
       (timer resets if user interacts; does not fire if already signed in)

After Google OAuth completes:
  │
  ├─ Check Clerk publicMetadata.onboardingComplete === true
  │     └─ YES → proceed to normal app
  │
  └─ NO → redirect to /onboarding
       Step 1: Confirm profile (name, phone number for ClickPesa)
       Step 2: Pay wayfinding fee via ClickPesa (if fee enabled in admin settings)
               • Fee amount and on/off state read from InsForge `app_settings` table
               • ClickPesa webhook → Server Action → mark payment verified in DB
               • Client polls payment status
       Step 3: On success → Clerk publicMetadata.onboardingComplete = true → redirect to map

  └─ On every subsequent login: check onboardingComplete → if false, redirect to /onboarding

Clerk org routing (for booth businesses):
  • After login, if user is a member of a Clerk org (booth):
    - Show Clerk <UserProfile> with personal profile option enabled
    - If user selects PERSONAL PROFILE → route to normal attendee map view
    - If user selects ORG (booth name) → route to the booth panel dashboard
      (`/booth` — defaults to the leads overview). The panel's side nav
      includes an "Organization Profile" item that opens Clerk's
      `<OrganizationProfile>` component (mounted at `/booth/organization-profile`,
      or as a Clerk modal via `openOrganizationProfile()`) — this is where
      business_name and logo live natively, plus a custom "Booth Details" page
      (added via Clerk's custom pages API) for category, description, and
      Mappedin space assignment
  • If user has no org membership → route to normal attendee map view
```

## Data Flow

```
Attendee post-onboarding opens event map
  → Server Component queries InsForge for active/upcoming events
  → Renders event list or active event floor plan
  → PostHog captures `app_opened`

Attendee searches for a booth
  → PostHog captures `booth_search_performed` (query, result_count)
  → PostHog captures `booth_search_result_selected` (booth_id) on tap

Attendee selects booth → taps "Navigate"
  → Mappedin draws route; distance estimate shown
  → A lead record is created automatically in InsForge `leads` — no form shown
    to the attendee. Name and phone are pulled from their confirmed onboarding
    profile (`user_profiles`), combined with `origin_space_id`, `origin_label`,
    `booth_id`, `navigated_at`
  → User visit recorded in `user_visits` (user_id, booth_id, booth_category,
    distance_walked, event_id, navigated_at) for preference profiling
  → `user_profiles.total_distance_walked` incremented atomically
  → Server Action calls /api/promotions/check → milestone winner check
  → PostHog captures `wayfinding_started` (booth_id, origin_space_id, booth_category)
  → PostHog captures `wayfinding_completed` (booth_id, distance_walked)

Contest entry flow:
  → Attendee posts on Instagram (photo/video) tagging the booth + campaign hashtag
  → Submits post URL on booth's event page (only visible before contest end_date)
  → Server Action → /api/contests/[contestId]/verify
    • Uses booth's Instagram access token to query the Instagram Graph API
    • Checks for: required tag present, campaign hashtag present, is video/photo,
      multiple product photos, whether user follows the booth account
    • Awards weighted entry count based on verified actions
    • Creates `contest_entries` record with entry_weight, ig_verified: true
  → Entry appears in booth's contest entries table

Winner draw:
  → Booth owner opens WinnerDrawModal in contest panel
  → Modal shows the crypto seed (generated at contest creation) + all entries
  → Booth owner clicks "Draw Winner"
  → Server Action: load all entries, expand into entry pool by weight,
    compute seedNumber = BigInt("0x" + seed), winnerIndex = Number(seedNumber % BigInt(pool.length))
  → Winner entry flagged in DB; `contest_audit_logs` row created
  → Modal displays winner name, phone, Clerk profile picture if available

Booth views analytics
  → Server Component: InsForge leads count = "visitors via wayfinding"
  → Server Component: InsForge user_visits aggregation = per-category breakdown
  → PostHog Insights API (server-side, POSTHOG_PERSONAL_API_KEY) = search counts
```

## Key Architectural Decisions

### Public map visible before auth
The event list and static map are visible without authentication. Auth is
triggered by intent (searching for a booth) or inactivity timeout (3 minutes),
not by page load — lowering the barrier to discovery.

### Onboarding as a one-time gate
`onboardingComplete` is stored in Clerk `publicMetadata` (not InsForge DB) so
it is always co-located with the user's auth state and available in both
server and client contexts via `auth().sessionClaims`. The payment record is
still stored in InsForge for financial audit purposes.

### Org-aware Clerk routing
boothfinder serves two user types in one app. Clerk's `<UserProfile>` component
handles the org context switcher. `proxy.ts` reads `auth().orgId` to determine
which route group a user enters. A user can be both an attendee (no org
context) and a booth member (org context) — the Clerk personal profile option
routes them back to the attendee experience without a separate account.

### Instagram OAuth is per-booth, not per-user
The Instagram connection belongs to the booth's business account (Instagram
Business or Creator account), not to individual attendees. Access tokens are
stored encrypted in InsForge `instagram_connections`, scoped to `booth_id`.
Only the booth owner (Clerk org admin) can connect or disconnect Instagram.
The Instagram Basic Display API cannot verify hashtags — the Instagram Graph
API with a Business account token is required.

### Cryptographic contest fairness
The crypto seed is generated with `crypto.randomBytes(32)` at contest creation
time (not at draw time) and stored in InsForge. It is displayed publicly in
**two places from the moment the contest is created**: (1) to the booth owner
in the contest setup/management panel, and (2) to attendees on the contest
details section of the booth's event page, alongside the contest start/end
dates — this lets any entrant independently verify the draw was not
manipulated after the fact, since the seed was public before entries even
opened. The audit log records: seed, generated_at, pool_size, winner_index,
winner_entry_id, drawn_at, drawn_by (Clerk user ID). This creates a
verifiable, reproducible draw.

### User profiling is privacy-respecting
PostHog events use only non-identifying IDs. InsForge `user_visits` stores
Clerk `userId` (not name/phone) alongside `booth_category` and
`distance_walked`. The preference aggregation Server Action joins `user_visits`
with `booths.category` to produce a preference map — PII (name/phone) from
`leads` is never joined into analytics queries.

### Clerk orgs map to roles
Three roles: `admin` (venue admin), `business` (booth owner via Clerk org),
`attendee` (general public). Route groups protected via `clerkMiddleware()` in
`proxy.ts`. InsForge RLS uses the `requesting_user_id()` SQL helper (returns
`sub` claim from JWT) — not `auth.uid()` which is Supabase-specific.

### PostHog vs InsForge — analytics split
- **InsForge `leads` + `user_visits`** — PII system of record; powers CSV export,
  visitor counts, and user preference profiles
- **PostHog** — anonymous behavioural events; powers search popularity and
  funnel analytics. Never receives `attendee_name`, `attendee_phone`, or any PII.
- "Hottest" = InsForge leads count. "Popular" = PostHog search-selection count.

### Booth identity lives in Clerk's Organization Profile
Rather than building a custom "edit listing" form, booth name and logo are
managed natively through Clerk's `<OrganizationProfile>` component — the same
place booth owners already go to manage members and org settings. boothfinder
adds one **custom page** to that same component (via Clerk's
`<OrganizationProfile.Page>` API) for the fields Clerk doesn't natively support:
category, description, and Mappedin space assignment. A Clerk webhook
(`organization.updated`) keeps `booths.business_name` and `booths.logo_url` in
sync with the Clerk org's `name` and `imageUrl` whenever they change, so
InsForge queries (map pins, search, leads exports) never need to call the
Clerk API directly — they read the synced copy.

### Leads are auto-generated, never re-collected
Because onboarding already captures and confirms the attendee's name and phone
number, the wayfinding flow never asks for these again. The moment a route is
drawn, a Server Action creates the `leads` row directly from the attendee's
`user_profiles` record (`user_id`, `name`, `phone`) plus the navigation context
(`origin_space_id`, `booth_id`). This removes friction from every single
navigation and guarantees the phone number on file is the same one verified
during the ClickPesa payment step.

### Promotion winner determination
Milestone promotions evaluated synchronously server-side — never client-side,
never async — to prevent race conditions awarding two winners for one slot.
When a promotion has `requires_qr_scan` enabled (optional, booth-configured),
the milestone counter only advances on QR scan confirmation, not on the
navigation itself — this lets a booth require physical presence at the booth
before someone counts towards "the 100th visitor," while every attendee is
still logged as a normal lead regardless of whether they scan.

## Environment Variables

```bash
# InsForge
NEXT_PUBLIC_INSFORGE_URL=
NEXT_PUBLIC_INSFORGE_ANON_KEY=

# Clerk (Google OAuth only — disable all other social providers)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Mappedin
NEXT_PUBLIC_MAPPEDIN_KEY=
NEXT_PUBLIC_MAPPEDIN_SECRET=

# ClickPesa
CLICKPESA_API_KEY=
CLICKPESA_WEBHOOK_SECRET=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
POSTHOG_PERSONAL_API_KEY=

# Instagram Graph API
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=
```

## Database Schema (High-Level)

| Table | Key Columns |
|-------|------------|
| `app_settings` | id, key, value, updated_by, updated_at (e.g. key=`wayfinding_fee_enabled`, key=`wayfinding_fee_amount_tzs`) |
| `venues` | id, name, address, city, created_by |
| `events` | id, venue_id, name, start_date, end_date, mappedin_map_id, status |
| `booths` | id, event_id, business_name (synced from Clerk org name), category, description, logo_url (synced from Clerk org image), mappedin_space_id, owner_user_id, clerk_org_id |
| `leads` | id, booth_id, attendee_name, attendee_phone, origin_space_id, origin_label, qr_scanned, qr_scanned_at, navigated_at |
| `payments` | id, user_id (Clerk), booth_id, amount_tzs, clickpesa_ref, verified_at, payment_type (`onboarding` \| `navigation`) |
| `user_profiles` | id, user_id (Clerk), full_name, phone_number, total_distance_walked_m, onboarding_complete, created_at, updated_at |
| `user_visits` | id, user_id (Clerk), booth_id, event_id, booth_category, distance_walked_m, origin_space_id, navigated_at |
| `instagram_connections` | id, booth_id, ig_user_id, ig_username, ig_page_id, access_token_encrypted, token_expires_at, connected_at, connected_by |
| `promotions` | id, booth_id, type (`milestone_visitor` \| `social_share_draw`), title, prize_description, scope (`day` \| `week` \| `event`), milestone_number, requires_qr_scan, qr_code_token, start_date, end_date, status |
| `promotion_entries` | id, promotion_id, lead_id, entry_type (`auto_milestone` \| `share_submission`), proof_url, is_winner, claimed_at |
| `contests` | id, booth_id, title, prize_description, hashtag, required_ig_tag, start_date, end_date, max_entries_per_user, engagement_weights (jsonb), crypto_seed, status (`draft` \| `active` \| `closed` \| `winner_drawn`), winner_entry_id, created_at |
| `contest_entries` | id, contest_id, user_id (Clerk), attendee_name, attendee_phone, post_url, ig_verified, ig_verified_at, entry_weight, entry_count, submitted_at |
| `contest_audit_logs` | id, contest_id, booth_id, crypto_seed, seed_generated_at, pool_size, winner_index, winner_entry_id, drawn_at, drawn_by_user_id |

### Notes on the contests schema
- `engagement_weights` is a JSONB column storing the booth-configured weight
  per action: `{ "photo": 1, "tag": 1, "hashtag": 1, "follow": 1, "video": 2, "multiple_photos": 2 }`.
  Default values match the system defaults but each booth can override.
- `entry_count` = sum of weights for all verified actions on a single submission.
- `crypto_seed` is generated with `crypto.randomBytes(32).toString('hex')` at
  contest creation and stored immediately — never regenerated.
- `max_entries_per_user` enforced server-side at submission time — can be 1 (one URL)
  or N (multiple submissions per user for the contest duration).
- `contest_audit_logs` is append-only — no updates, no deletes, ever.

### Notes on the promotions schema
- A `milestone_visitor` promotion counts towards its milestone (e.g. "100th
  visitor") using **only leads where `qr_scanned = true`** when
  `requires_qr_scan` is enabled on the promotion. Every navigation still
  creates a `leads` row as usual (`qr_scanned` defaults to `false`) — the QR
  scan is what promotes a regular visit into a counted entry, not a
  prerequisite for the visit itself.
- If a booth has QR scanning enabled: a unique `qr_code_token` is generated
  per promotion and displayed as a printable/scannable QR code at the physical
  booth. When an attendee scans it (via a simple `/scan/[token]` page opened
  by their phone camera), the Server Action marks their most recent `leads`
  row for that booth as `qr_scanned: true, qr_scanned_at: now()` — this is
  what triggers the milestone count check.
- If `requires_qr_scan` is disabled on a promotion, every lead counts towards
  the milestone as before (no QR gate) — this is the default/simpler mode.
- A `milestone_visitor` promotion auto-creates a `promotion_entries` row
  (`entry_type: auto_milestone`, `is_winner: true`) when the Nth *qualifying*
  lead (QR-scanned if required) is recorded.
- `scope` determines counter reset: `day` resets daily, `week` weekly, `event`
  counts across the entire event with no reset.
