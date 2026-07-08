# boothfinder — UI Rules

These rules apply to every UI file. Follow them without exception.

## Color & Theming

- ✅ Use CSS variables from `ui-tokens.md` or the mapped Tailwind token classes
- ❌ Never use raw hex values (e.g. `#2563EB`) or arbitrary Tailwind classes (e.g. `text-[#2563EB]`)
- ✅ Dark mode: Tailwind `dark:` prefix is the mechanism — tokens auto-switch in `.dark` scope
- ✅ Map overlay elements (pins, routes, user dot) use the `--color-*` map tokens defined in `ui-tokens.md`

## Layout

- Max content width: `max-w-screen-xl mx-auto` with `px-4` on mobile, `px-6` on `md:`
- The attendee map view is full-viewport (`h-screen w-screen overflow-hidden`) — no scrolling while navigating
- Bottom sheet pattern for booth details — never a full-page modal on mobile
- Admin and booth panels use a sidebar layout on `lg:` and a top tab bar below `lg:`

## Typography

- All headings: `font-ubuntu font-bold` (mapped via `font-sans`)
- Body text: `text-base text-text`
- Metadata / captions: `text-sm text-text-subtle`
- Map UI labels (booth names, distances): `text-xs font-medium` — keep them compact

## Components

- Use shadcn/ui primitives before building anything custom — check `ui-registry.md` first
- ✅ Any tabular data (leads, contest entries, promotion entries, admin lists)
  uses diceui's **DataTable** — never shadcn's bare `Table` — for consistent
  sorting, filtering, and pagination across the app
- Bottom sheets use shadcn `Sheet` with `side="bottom"`
- All forms use shadcn `Input`, `Label`, `Button` — no bare HTML form elements
- Loading skeletons use shadcn `Skeleton` — never a spinner for content loads
- Empty states always show an icon + short message + action CTA (never blank space)
- Every new component must be registered in `ui-registry.md` immediately after building

## Map UI Specifics

- The Mappedin canvas always fills its parent container — never set explicit pixel dimensions
- Wayfinding overlay controls (recenter, zoom) float in the bottom-right at `z-50`
- The booth info bottom sheet slides up over the map — do not navigate away from the map
- Blue-dot position updates every 3 seconds — do not re-render the whole map, only the position layer
- If Mappedin offline maps are active, show a subtle "Offline map" badge in the top-left corner

## Responsive Design

- Mobile-first: base styles for mobile; `md:` and `lg:` for larger screens
- The app is primarily used on mobile at a trade fair — optimise for 375–430 px widths first
- Touch targets minimum 44 × 44 px for all interactive elements
- Navigation bar is always bottom-anchored on mobile (`fixed bottom-0`)

## Animations & Transitions

- Page transitions: 200 ms fade — use Tailwind `transition-opacity duration-200`
- Bottom sheet open/close: handled by shadcn Sheet (do not override its animation)
- Map route drawing: Mappedin SDK animates the route — do not add additional CSS on top
- Always respect `prefers-reduced-motion` — wrap custom animations in a media query check

## Forms & Inputs

- All validation with Zod schemas in `lib/validations.ts` + react-hook-form — no manual validation
- Inline error messages below each field using shadcn `FormMessage`
- Phone number inputs: always use `type="tel"` with a Tanzania `+255` country prefix selector
- Submit buttons show a loading spinner (shadcn `Loader2` icon) while awaiting server response

## Payments

- ClickPesa payment modal is always a shadcn `Dialog` — full-screen on mobile (`sm:max-w-md`)
- Payment status shows three states: "Awaiting payment", "Processing", "Confirmed" — each with a distinct icon and colour token
- Never show the booth navigation UI until payment status is `verified` from the server

## Promotions & Marketing

- The congratulations popup (milestone winner) uses shadcn `Dialog`, centred,
  non-dismissible by background click — the attendee must tap "Claim your gift"
  or "Close" explicitly
- Congrats popup uses `--color-success` and a celebratory but on-brand tone —
  no generic confetti GIFs; use a simple CSS confetti burst or static icon
- The share-to-win prompt appears as a bottom sheet immediately after a
  successful wayfinding completion — never interrupt the active navigation view
- Booth detail view shows a small visitor count badge (e.g. "248 visitors this
  event") using `Badge` from shadcn, positioned near the booth name — pull this
  number from the InsForge leads count, not PostHog
- Promotion setup form (booth panel) is a multi-step shadcn `Form`: 1) choose
  type (milestone vs. share draw), 2) set scope (day/week/event) and dates,
  3) set the prize description, 4) optional QR-gate toggle ("require attendees
  to scan a code at the booth to count towards the milestone"), 5) review and activate
- When QR-gating is enabled, the booth panel shows a printable QR code card
  (using the generated `qr_code_token`) with a "Print / Download" button —
  sized for a small table-top sign
- Active promotions show a status `Badge` (`Active`, `Scheduled`, `Ended`) on
  the booth panel promotions list, plus a small QR icon badge if QR-gating is on
- The `/scan/[token]` page (opened by the attendee's camera) is a minimal
  full-screen confirmation: a checkmark icon, "You're checked in at
  {business_name}!" — no navigation chrome, no further action required

## Accessibility

- All images need descriptive `alt` text; decorative images get `alt=""`
- Icon-only buttons (map controls, close buttons) need `aria-label`
- Colour contrast must meet WCAG AA — use the defined tokens, which are pre-calibrated
- Focus ring must be visible on all interactive elements — never remove `outline`

## Forbidden Patterns

- ❌ Inline styles (`style={{ }}`) — use Tailwind classes
- ❌ `!important` overrides
- ❌ Arbitrary Tailwind values when a token-based class exists
- ❌ `<img>` tags — use `next/image` for all images
- ❌ Hardcoded phone/amount strings — always pull from DB or env variables
- ❌ Opening a new tab/window for the payment flow — keep it in a modal

## Onboarding

- Onboarding is a full-screen modal (shadcn `Dialog`, `sm:max-w-lg`, not dismissible
  by background click or Escape key) with a multi-step progress indicator at the top
- Steps: 1) Confirm profile (name, phone), 2) Pay fee (ClickPesa), 3) Success → enter map
- The phone number from step 1 is pre-filled into the ClickPesa payment step
- The "You must complete setup to use wayfinding" message is shown in a yellow
  `--color-warning-subtle` banner if a user bypasses onboarding and tries to navigate

## Idle Sign-In Prompt

- After 3 minutes of inactivity (unauthenticated), show a centered shadcn `Dialog`
  with a single "Sign in with Google" button — not a redirect, not a toast
- The dialog is not dismissible; the only action is to sign in
- On mobile the dialog slides up as a bottom sheet (`Sheet side="bottom"`) for
  better thumb-reach

## Contests

- The attendee-facing contest details section (on the booth's event page) shows:
  prize description, hashtag, required tag, start/end dates, and the
  **cryptographic seed** — displayed in a `font-mono text-xs` chip with a small
  info tooltip explaining "This seed was published when the contest started
  and determines the winner — nobody can change it." This builds trust before
  anyone enters.
- Contest entry submission form (post URL input) is hidden entirely after
  `contest.end_date` — use a server-computed boolean `isContestOpen` prop, do
  not rely on client-side date comparison
- When `isContestOpen === false`, show a "Contest closed" `Badge` (variant error)
  and the close date — no input field, no submit button. The seed remains
  visible even after closing, for post-draw verification.
- The `WinnerDrawModal` uses a diceui **Spinner** component for the animated draw
  reveal — import from `components/ui/` after adding via diceui CLI
- The modal shows: crypto seed, total entries, entry pool size, then the animated
  draw, then winner name + phone + profile photo (from Clerk if available)
- Audit log is displayed below the draw result — seed, drawn_at, pool_size,
  winner_index — in a monospace `font-mono text-xs` block inside a collapsible
  shadcn `Collapsible` component
- Contest entries diceui DataTable columns: Attendee name | Submission date |
  IG post link | Verified ✓/✗ | Entry weight | Entries count | Status —
  sortable and filterable (filter by Verified status is the most common use case)

## User Profile / Distance

- Total distance walked shown on the user's profile page as `X.XX km`
  (convert from stored metres: `(metres / 1000).toFixed(2)`)
- Booth category preference breakdown shown as a simple horizontal bar chart
  (shadcn-compatible, no heavy chart library needed — use CSS width percentages)
- These sections are read-only for the attendee; booth businesses see a richer
  aggregated version of this data as a paid feature in their analytics panel

## Instagram Connect

- "Connect Instagram" button in booth panel uses shadcn `Button` variant `outline`
  with the Instagram gradient icon (SVG inline — do not use a third-party icon pack)
- Once connected, show connected IG username in a green `Badge` + "Disconnect" link
- Disconnecting prompts a shadcn `AlertDialog` ("Are you sure? This will disable
  all active contest verification") before proceeding
