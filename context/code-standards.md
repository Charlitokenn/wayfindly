# boothfinder — Code Standards

## Language & Typing

- Language: **TypeScript 5** (strict mode enabled in `tsconfig.json`)
- No `any` types — ever. Fix the upstream type instead.
- Use `type` for object shapes and union types; `interface` for things that may be extended
- All external API responses (InsForge, ClickPesa webhooks, Mappedin) must be validated
  with Zod schemas in `lib/validations.ts` before use
- Avoid type assertions (`as`) — fix the upstream type

## File & Folder Naming

| Artefact | Convention | Example |
|----------|-----------|---------|
| Components | `PascalCase.tsx` | `BoothCard.tsx` |
| Pages / routes | `page.tsx` inside kebab-case folders | `events/[eventId]/page.tsx` |
| Utility files | `camelCase.ts` | `formatPhone.ts` |
| Hooks | `use` prefix, camelCase | `usePaymentStatus.ts` |
| Types | `PascalCase` inside `types/index.ts` | `type Booth = { ... }` |
| Zod schemas | `camelCase` + `Schema` suffix | `const boothSchema = z.object(...)` |
| Constants | `SCREAMING_SNAKE_CASE` | `const CLICKPESA_TIMEOUT_MS = 30000` |
| PostHog events | `snake_case` verb-based | `booth_search_performed`, `wayfinding_started` |

## Component Structure

```tsx
// Server Component (default — no directive needed)
import type { Booth } from '@/types';
import { getBoothsByEvent } from '@/lib/insforge';

export default async function BoothList({ eventId }: { eventId: string }) {
  const booths = await getBoothsByEvent(eventId);
  return (...);
}

// Client Component — add directive only when needed
'use client';
import { useState } from 'react';

export function BoothSearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');
  return (...);
}
```

Add `'use client'` only when the component needs browser APIs, event handlers,
React hooks, or the Mappedin SDK. Move it as low in the tree as possible.

## Imports

- Use `@/` path aliases for all cross-folder imports — never `../../`
- Group imports: 1) React/Next, 2) third-party, 3) internal — separated by blank lines
- No barrel `index.ts` files — import directly from the source file

```ts
// ✅ Correct
import { Suspense } from 'react';
import { z } from 'zod';
import { getBoothsByEvent } from '@/lib/insforge';
import BoothCard from '@/components/booths/BoothCard';

// ❌ Wrong
import BoothCard from '../../components/booths/BoothCard';
```

## Data Fetching

- Server Components call InsForge directly — no `useEffect` for data, ever
- Mutations use Server Actions — no hand-rolled fetch calls for CRUD from the client
- Always call `revalidatePath` or `revalidateTag` after mutations
- InsForge calls return `{ data, error }` — check `error` explicitly; don't
  rely on try/catch for InsForge's own validation failures (it doesn't throw
  for those). Reserve try/catch for genuinely unexpected failures (network
  errors, malformed responses).

```ts
// ✅ Correct — Server Action
'use server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@insforge/sdk';

export async function updateBoothListing(data: BoothUpdateInput) {
  const { getToken } = await auth();
  const token = await getToken({ template: 'insforge' });

  const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    isServerMode: true,
    edgeFunctionToken: token ?? undefined,
  });

  const { data: updated, error } = await insforge
    .from('booths')
    .update(data)
    .eq('id', data.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/booths');
  return { success: true, data: updated };
}
```

InsForge's SDK returns `{ data, error }` from every call — it does not throw.
Check `error` explicitly rather than wrapping every call in try/catch for
control flow; reserve try/catch for genuinely unexpected failures (network
errors, etc.). In server mode the client has no persisted session, so it must
be constructed per-request with a fresh `edgeFunctionToken` from Clerk's
`getToken({ template: 'insforge' })` — see `context/library-docs.md` → InsForge.

## Error Handling

- Use Next.js `error.tsx` files for page-level errors
- Use `notFound()` for missing venues, events, or booths — never return null from a page
- Toast notifications (shadcn `toast`) for non-critical action errors
- Error boundary (`error.tsx`) for map rendering failures

## State Management

- Server state only — no Zustand, Redux, or Jotai unless explicitly discussed
- URL search params (via `nuqs`) for filter/sort state in booth discovery
- Local `useState` for UI-only state (modal open, form step, etc.)
- Payment status is polled from the server every 2 seconds — no WebSocket needed for v1

## Performance

- `next/image` for all images — never bare `<img>`
- Mappedin viewer is loaded with `dynamic(() => import(...), { ssr: false })` — it is browser-only
- Large data tables (leads list) are paginated — never load all rows at once
- PWA shell caches static assets; Mappedin SDK handles its own offline tile caching

## Testing

- Framework: **Vitest**
- Unit tests for: utility functions (`lib/utils.ts`), Zod schemas, payment verification logic
- Test files co-located with source: `lib/utils.test.ts`, `lib/validations.test.ts`
- No component tests in v1 — manual QA on device for map and payment flows
- Run `npm run test` before every PR merge

## Git / Commits

- Commit format: `type(scope): description`
  - `feat(map): add blue-dot position tracking`
  - `fix(payments): verify webhook signature before updating DB`
  - `chore(deps): upgrade mappedin sdk to latest`
- One feature per PR; keep PRs focused and reviewable
- Never commit `.env.local`, `node_modules`, or Mappedin cache files

## Linting & Formatting

- Linter: ESLint with Next.js recommended config
- Formatter: Prettier (`printWidth: 100`, `singleQuote: true`, `semi: true`)
- Run `npm run lint && npm run build` before every commit — must pass with zero errors

## Contest & Cryptographic Draw

```ts
// ✅ Correct — seed generation at contest creation
import crypto from 'crypto';

export function generateContestSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ✅ Correct — deterministic winner selection
export function pickWinnerIndex(seed: string, poolSize: number): number {
  const seedNumber = BigInt('0x' + seed);
  return Number(seedNumber % BigInt(poolSize));
}

// ✅ Correct — expand entries into pool by weight
export function buildEntryPool(
  entries: { id: string; entry_count: number }[]
): string[] {
  return entries.flatMap(e => Array(e.entry_count).fill(e.id));
}
```

- Seed is generated ONCE — at contest creation — and stored immediately. Never
  regenerate; never accept a seed from the client.
- `contest_audit_logs` rows are INSERT-only from server code. Any attempt to
  UPDATE or DELETE an audit log row must fail at the RLS level.
- The `WinnerDrawModal` receives the pre-computed winner from a Server Action
  return value — it does not run the draw logic itself.
- Display the seed on the contest detail page from the moment the contest is
  created (so booth owners can independently verify the draw is fair).

## Instagram API Calls

- All Instagram Graph API calls go through `lib/instagram/api.ts` — never call
  the API directly from a component or Server Action
- Access tokens are decrypted server-side in `lib/instagram/oauth.ts` —
  the decrypted token is never passed to the client or logged
- Rate limit: 200 calls/hour per token. Cache `ig_verified` results in InsForge
  `contest_entries` — never re-call the API for an already-verified entry
- Verification results stored as `ig_verified: true/false` + `ig_verified_at`
  in `contest_entries` — entries where `ig_verified: false` are excluded from
  the draw pool

## Idle Timer

```ts
// ✅ Correct pattern for 3-minute idle sign-in prompt
'use client';
import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

const IDLE_MS = 3 * 60 * 1000; // 3 minutes

export function useIdleSignInPrompt(onIdle: () => void) {
  const { isSignedIn } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isSignedIn) return; // already signed in — no timer needed

    const reset = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onIdle, IDLE_MS);
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset));
    reset(); // start timer on mount

    return () => {
      clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [isSignedIn, onIdle]);
}
```

## User Visit Recording

- Record a `user_visits` row in a Server Action immediately after a wayfinding
  route is drawn (not on completion — completion tracking can fail if user
  closes the app mid-route)
- Increment `user_profiles.total_distance_walked_m` atomically using an
  InsForge RPC or update-with-increment to avoid race conditions
- Distance comes from Mappedin `directions.distance` (metres) — store raw metres,
  convert to km only in the UI
