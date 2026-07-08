# boothfinder — Library-Specific Notes

> Before using any library, read its section here for project-specific constraints.
>
> **Verified against official docs**: 2026-06-19. APIs below reflect Next.js 16.x,
> Clerk Core 3, InsForge SDK (`@insforge/sdk`), Mappedin Web SDK v6, PostHog
> Next.js guidance, Instagram Graph API v21+, and diceui.com components.
>
> **When in doubt, use the Context7 MCP connector** to fetch the latest official
> docs and code patterns for any library before implementing — do not rely solely
> on training data or this file for rapidly-evolving APIs (Clerk, InsForge,
> Instagram Graph API, Mappedin v6).

---

## Context7 MCP

- Connected via the Claude MCP connector (URL: `https://mcp.context7.com/mcp`)
- Use `resolve-library-id` to map a package name to a Context7 library ID,
  then `query-docs` to fetch current docs and code examples
- Invoke before implementing any feature that touches: Clerk, InsForge,
  Mappedin SDK, PostHog, Instagram Graph API, diceui.com, ClickPesa, next-pwa
- Example workflow:
  ```
  resolve-library-id("@mappedin/react-sdk")
  → query-docs(libraryId, topic="wayfinding directions v6")
  ```

---

## Next.js (App Router, 16.x)

- Turbopack is the default bundler — only pass `--webpack` if explicitly falling back
- Default to Server Components; add `'use client'` only when necessary
- Data fetching: Server Components call InsForge directly; mutations via Server Actions
- Navigation: `next/navigation` (`useRouter`, `redirect`, `notFound`) — not `next/router`
- Images: always `next/image` — configure `remotePatterns` in `next.config.ts` for InsForge storage domain
- **Middleware file is named `proxy.ts`** in Next.js 16 (was `middleware.ts` in ≤15)
- PWA: `next-pwa` registers service worker in production; Mappedin handles its own offline tile cache separately
- PostHog initialised in `instrumentation-client.ts` at project root (no manual provider needed)

---

## Tailwind CSS v4

- v4 replaces `tailwind.config.ts` with a CSS-first `@theme` directive in `globals.css`
- Do NOT use `tailwind.config.ts` patterns from v3 documentation
- Custom tokens are in `context/ui-tokens.md` and wired into `globals.css` via `@theme`
- Arbitrary values (`text-[#2563EB]`, `h-[220px]`) are forbidden — always use a token class
- Verify class names against v4 docs before use — some v3 names changed

---

## shadcn/ui

- Components live in `components/ui/` — never edit them directly
- Add new components: `npx shadcn@latest add <component-name>`
- Check `context/ui-registry.md` before building anything custom
- Key components in use: `Button`, `Input`, `Label`, `Sheet`, `Dialog`, `Skeleton`,
  `Badge`, `Toast`, `Form`, `Select`, `Separator` (use diceui's **DataTable**
  instead of shadcn's basic `Table` for anything with sorting/filtering/pagination —
  see the diceui section below)

---

## diceui.com

- Use for the contest winner draw UI — specifically the **Spinner** component
- Use **DataTable** for every tabular UI in the app — leads, contest entries,
  promotion entries, payments, venues/events/booths admin lists. Do not use
  shadcn's bare `Table` primitive for anything with sorting, filtering,
  pagination, or row selection; diceui's DataTable wraps TanStack Table with
  pre-styled, accessible controls that match this project's design tokens.
- Install per diceui.com docs: e.g `npx shadcn@latest add "@diceui/<component_name>"`
- Components are drop-in compatible with shadcn/ui (same Radix + Tailwind base)
- Standard DataTable usage across the app:
  - **Leads table** (booth panel) — columns: name, phone, origin, destination,
    QR scanned ✓/✗, date; sortable by date, filterable by QR-scanned status
  - **Contest entries table** (booth panel) — columns: attendee name,
    submission date, IG post link, verified ✓/✗, entry weight, entry count,
    status; filterable by verified status
  - **Promotion entries table** (booth panel) — columns: attendee, entry type,
    is winner, claimed status, date
  - **Admin lists** (venues, events, booths, payments) — standard sortable/
    filterable/paginated DataTable throughout
- Use Context7 to fetch current diceui component APIs before implementing:
  `query-docs(libraryId="diceui", topic="data-table spinner")`
- diceui components live in `components/ui/` alongside shadcn components

---

## Clerk (Core 3)

- **Google OAuth only** — disable all other social providers in the Clerk Dashboard.
  Do not add email/password, GitHub, or any other provider.
- Route protection via `clerkMiddleware()` exported from **`proxy.ts`** at project root
- By default `clerkMiddleware()` protects nothing — opt in via `auth.protect()` in the matcher
- Server-side: `await auth()` from `@clerk/nextjs/server`
- Client-side: `useAuth()` or `useUser()` from `@clerk/nextjs`
- Conditional rendering: use `<Show when="signed-in">` and `<Show when="signed-out">`
  (Clerk Core 3 — replaces older `<SignedIn>` / `<SignedOut>`)
- **Onboarding gate**: store `onboardingComplete: boolean` in `publicMetadata` via
  Clerk Backend API (Server Action using `CLERK_SECRET_KEY`). Read it in `proxy.ts`
  via `auth().sessionClaims?.metadata?.onboardingComplete` to redirect incomplete users.
- **Org routing**: after login, check `auth().orgId`:
  - Has org → show `<UserProfile>` with `hidePersonal={false}` (personal profile option enabled)
    - Personal profile selected → route to attendee map
    - Org selected → route to `/booth` (panel dashboard)
  - No org → route to attendee map directly
- **Organization Profile as the listing editor**: mount Clerk's
  `<OrganizationProfile>` at `/booth/organization-profile`. Add a custom page
  for boothfinder-specific fields using the custom pages API:
  ```tsx
  <OrganizationProfile>
    <OrganizationProfile.Page label="Booth Details" url="booth-details" labelIcon={<StoreIcon />}>
      {/* category, description, mappedin_space_id form — writes to InsForge `booths` */}
    </OrganizationProfile.Page>
  </OrganizationProfile>
  ```
  Business name and logo are edited on Clerk's native "General" page within
  the same component — no separate form needed for those fields.
- **Keeping InsForge in sync**: register an `organization.updated` webhook
  (Clerk Dashboard → Webhooks) pointing to an API route that updates
  `booths.business_name` and `booths.logo_url` whenever the org's `name` or
  `imageUrl` changes, so map pins and search stay current without a live
  Clerk API call on every read.
- Three roles:
  - `admin` — `publicMetadata.role === 'admin'`
  - `business` — Clerk org member (any org)
  - `attendee` — authenticated user with no org
- **Idle sign-in prompt**: implement a client-side 3-minute idle timer in a layout
  Client Component. If user has not signed in after 3 minutes of inactivity, open
  a Clerk `<SignInButton mode="modal">` — do not redirect, show a modal overlay.
  Timer resets on any user interaction (mouse/touch/keyboard).
- **InsForge bridge**: JWT Template named `insforge` in Clerk Dashboard. Call
  `getToken({ template: 'insforge' })` server-side to mint a Clerk-signed JWT,
  pass as `edgeFunctionToken` to InsForge.

---

## InsForge (`@insforge/sdk`)

- `createClient({ baseUrl, isServerMode?, edgeFunctionToken? })`
- **Browser mode** (default): session auto-persisted; used in Client Components
- **Server mode** (`isServerMode: true`): no session persistence; construct per-request
  with fresh `edgeFunctionToken` from `await getToken({ template: 'insforge' })`
- All calls return `{ data, error }` — check `error` explicitly, don't use try/catch
  for InsForge control flow
- DB: `.from('table').select()`, `.insert([{...}])` (always array), `.update().eq()`,
  `.delete().eq()`
- Storage: `insforge.storage.from('bucket').upload()` / `.download()` / `.remove()`
  — booth logos → `booth-logos` bucket; Instagram tokens NOT stored in storage
    (store encrypted in DB)
- Edge Functions: `insforge.functions.invoke('name', { body })`
- **RLS**: uses `requesting_user_id()` SQL helper returning `sub` from JWT claims
  (Clerk user IDs are strings, not UUIDs — never use `auth.uid()`)
  ```sql
  create or replace function public.requesting_user_id()
  returns text language sql stable as $$
    select nullif(
      current_setting('request.jwt.claims', true)::json->>'sub', ''
    )::text
  $$;
  ```
- `contest_audit_logs` table: INSERT only, never UPDATE or DELETE — enforce via RLS
  (`USING (false)` on UPDATE/DELETE policies)
- Instagram `access_token_encrypted`: encrypt with AES-256-GCM using a server-only
  `ENCRYPTION_KEY` env var before storing; decrypt on read in Server Actions only

---

## Mappedin Web SDK v6 / React SDK v6

- Packages: `@mappedin/react-sdk` + `@mappedin/mappedin-js` (must be same minor version)
- **Browser-only** — load with `dynamic(() => import(...), { ssr: false })`
- Import CSS: `import '@mappedin/react-sdk/lib/esm/index.css'`
- Core pattern:
  ```tsx
  'use client';
  import { MapView, useMapData } from '@mappedin/react-sdk';
  const { mapData, isLoading } = useMapData({
    key: process.env.NEXT_PUBLIC_MAPPEDIN_KEY!,
    secret: process.env.NEXT_PUBLIC_MAPPEDIN_SECRET!,
    mapId: event.mappedin_map_id,
  });
  ```
- Wayfinding: `departure.directionsTo(destination)` → render with `<Navigation>`
  component (NOT `drawPath()` — that's v5)
- Blue-dot: `mapView.BlueDot.enable()` — listen on `mapView.on('blue-dot-position-update', ...)`
- **Distance tracking**: capture distance from `<Navigation>` directions result
  (`directions.distance`) in metres — store in `user_visits.distance_walked_m` and
  increment `user_profiles.total_distance_walked_m` via Server Action
- v5 patterns that are GONE in v6: `getVenue()`, `Journey`, `drawPath()`,
  `MappedinMap.startPositionUpdates()`, `map.isOffline`
- Use Context7 to verify current v6 API before implementing any SDK feature

---

## ClickPesa

- Tanzania mobile money gateway (Vodacom M-Pesa, Tigo Pesa, Airtel Money, Halotel)
- API client in `lib/clickpesa.ts` — never call ClickPesa directly from a component
- **Onboarding payment flow**:
  1. Onboarding step reads `app_settings` (wayfinding_fee_enabled + amount) from InsForge
  2. If enabled: Server Action initiates ClickPesa charge with user's phone (from onboarding form)
  3. ClickPesa webhook → `/api/payments/webhook` → verify `CLICKPESA_WEBHOOK_SECRET` →
     write `payments` record → update Clerk `publicMetadata.onboardingComplete = true` via Backend API
  4. Client polls payment status every 2s → redirects to map on completion
- Phone numbers: Tanzania format `255XXXXXXXXX` (no `+`, no leading `0`)
- Amounts: TZS integers (no decimals)
- 5-minute timeout → mark payment `expired` → user can retry
- `payment_type` field: `'onboarding'` for the wayfinding fee, `'navigation'` reserved for future per-navigation charges

---

## PostHog

- Init: `instrumentation-client.ts` at project root
  ```ts
  import posthog from 'posthog-js';
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30',
  });
  ```
- Server-side: `posthog-node` with `POSTHOG_PERSONAL_API_KEY`
- **Zero PII in events** — no name, phone, GPS, or anything identifying
- Standard events:
  - `app_opened`
  - `booth_search_performed` — `{ query, result_count }`
  - `booth_search_result_selected` — `{ booth_id, booth_category }`
  - `wayfinding_started` — `{ booth_id, origin_space_id, booth_category }`
  - `wayfinding_completed` — `{ booth_id, distance_m }`
  - `onboarding_started` / `onboarding_completed`
  - `payment_initiated` / `payment_confirmed` — `{ amount_tzs }`
  - `contest_entry_submitted` — `{ contest_id, booth_id, entry_weight }`
- PostHog Insights API queried server-side only (`POSTHOG_PERSONAL_API_KEY` stays server)

---

## Instagram Graph API (Meta)

- Requires a **Meta App** in the Meta Developer portal with `instagram_basic`,
  `instagram_manage_comments`, `pages_read_engagement` permissions at minimum
- Booths must have an Instagram **Business or Creator** account (not personal)
  — the Graph API hashtag/tag search only works with Business/Creator tokens
- **OAuth flow** (booth owner connects their IG page):
  1. Booth owner clicks "Connect Instagram" → Server Action generates OAuth URL:
     `https://api.instagram.com/oauth/authorize?client_id={INSTAGRAM_APP_ID}&redirect_uri={INSTAGRAM_REDIRECT_URI}&scope=instagram_basic,pages_read_engagement&response_type=code`
  2. User authorises → Instagram redirects to `/api/auth/instagram/callback?code=...`
  3. Server Action exchanges code for short-lived token → exchanges for long-lived token
     (60-day expiry — this is fixed by Instagram's platform, not configurable)
     → encrypts and stores in InsForge `instagram_connections`
  4. Cloudflare scheduled worker checks `token_expires_at` daily and refreshes
     any token expiring **within 30 days** — refreshing well ahead of the
     60-day cliff avoids any risk of a lapsed connection breaking contest
     verification mid-event
- **Post verification** (`lib/instagram/verify.ts`):
  Use the booth's stored access token to query the post by URL.
  Verification checks (each returns true/false, used to compute entry weight):
  - `photo` — media type is `IMAGE`
  - `video` — media type is `VIDEO` or `REEL`
  - `multiple_photos` — media type is `CAROUSEL_ALBUM`
  - `hashtag` — `caption` contains the contest `hashtag`
  - `tag` — `caption` contains `@{required_ig_tag}` or user tagged via `@mentions`
  - `follow` — query `GET /{ig-user-id}/follows` to check if the post author follows the booth's IG page
  - Instagram API rate limits: 200 calls/hour per token — cache verification results
    in InsForge; never re-verify an already-verified entry
- **Limitations**: The Instagram Graph API cannot directly fetch posts by hashtag in
  real-time for arbitrary users without those users being connected to your app.
  The verification approach used here is: fetch the post by URL using `GET /{media-id}`
  (requires the post author's media ID derivable from the post URL, or the user provides
  the shortcode). Use Context7 to verify the current recommended endpoint before implementing.
- Use Context7 to fetch the latest Instagram Graph API docs before implementing
  any verification logic — the API changes frequently

---

## next-pwa

- Configured in `next.config.ts`
- Cache strategy: `StaleWhileRevalidate` for API routes; `CacheFirst` for static assets
- Mappedin's offline tile cache is separate from the SW cache
- `public/manifest.json` defines PWA install experience
- PostHog events queue locally when offline and flush when connectivity returns
- Show "You are offline" banner (check `navigator.onLine` + `online`/`offline` events)
  and disable payment and Instagram submission flows gracefully

---

## Version Lock

| Library | Locked Version | Reason |
|---------|---------------|--------|
| `next` | `^16.x` | `proxy.ts` middleware convention; Turbopack default |
| `tailwindcss` | `^4.0.0` | v4 CSS-first config; `@theme` directive |
| `@clerk/nextjs` | latest (Core 3) | `<Show>` components; `proxy.ts`; deprecates fast |
| `@mappedin/mappedin-js` + `@mappedin/react-sdk` | pin matching minor | Must stay same minor; v6 breaks v5 patterns |
| `@insforge/sdk` | latest | Fast-moving platform; track changelog |
| `posthog-js` / `posthog-node` | latest | Watch for `@posthog/next` stable |
| Instagram Graph API | v21+ | Pin in API base URL; older versions deprecated on rolling schedule |
